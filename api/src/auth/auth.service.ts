import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new UnauthorizedException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 10);
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    const demoMode = !this.mail.isConfigured();

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        verifyCode: demoMode ? null : verifyCode,
        emailVerified: demoMode,
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, emailVerified: true },
    });

    if (demoMode) {
      await this.mail.sendVerificationCode(dto.email, verifyCode);
      return {
        user,
        demoMode: true,
        message: 'Demo mode: account is ready to use. Verification codes are logged in the API console.',
      };
    }

    await this.mail.sendVerificationCode(dto.email, verifyCode);
    return { user, demoMode: false, message: 'Registration successful. Check your email for the verification code.' };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (user.banned) {
      throw new UnauthorizedException('Account suspended. Contact support.');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Email not verified. Check your inbox for the verification code.');
    }

    const rememberMe = dto.rememberMe !== false;
    const token = this.signToken(user.id, user.email, user.role, rememberMe);
    return {
      accessToken: token,
      expiresIn: rememberMe ? '30d' : '1d',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.verifyCode !== code) {
      throw new UnauthorizedException('Invalid verification code');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verifyCode: null },
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'If the email exists, a verification code was sent' };
    if (user.emailVerified) throw new BadRequestException('Email is already verified');

    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    await this.prisma.user.update({ where: { id: user.id }, data: { verifyCode } });
    await this.mail.sendVerificationCode(email, verifyCode);

    return { message: 'Verification code sent' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'If the email exists, a reset code was sent' };

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    await this.prisma.user.update({ where: { id: user.id }, data: { resetToken } });
    await this.mail.sendPasswordResetCode(email, resetToken);

    return { message: 'If the email exists, a reset code was sent' };
  }

  async resetPassword(email: string, code: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.resetToken !== code) {
      throw new UnauthorizedException('Invalid reset code');
    }

    const hashed = await bcrypt.hash(password, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null },
    });

    return { message: 'Password updated successfully' };
  }

  private signToken(userId: string, email: string, role: string, rememberMe = true) {
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) throw new BadRequestException('JWT_SECRET is not configured');
    return this.jwt.sign(
      { sub: userId, email, role },
      { secret, expiresIn: rememberMe ? '30d' : '1d' },
    );
  }
}
