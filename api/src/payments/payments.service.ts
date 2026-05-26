import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class PaymentsService {
  private stripe: Stripe | null = null;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private mail: MailService,
  ) {
    const key = this.config.get('STRIPE_SECRET_KEY');
    if (key && !key.includes('your_stripe')) {
      this.stripe = new Stripe(key);
    }
  }

  isStripeConfigured() {
    return !!this.stripe;
  }

  async createPaymentIntent(userId: string, bookingId: string, amount: number) {
    const booking = await this.prisma.booking.findFirst({ where: { id: bookingId, userId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status === 'CONFIRMED') {
      throw new BadRequestException('Booking is already confirmed');
    }

    let stripeIntentId: string | undefined;
    let clientSecret: string | undefined;

    if (this.stripe) {
      const intent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        metadata: { bookingId, userId },
        automatic_payment_methods: { enabled: true },
      });
      stripeIntentId = intent.id;
      clientSecret = intent.client_secret ?? undefined;
    }

    const payment = await this.prisma.payment.upsert({
      where: { bookingId },
      create: {
        userId,
        bookingId,
        amount,
        stripeIntentId,
        status: 'PENDING',
      },
      update: { stripeIntentId, amount, status: 'PENDING' },
    });

    return {
      payment,
      clientSecret,
      stripeConfigured: !!this.stripe,
    };
  }

  async confirmPayment(bookingId: string, userId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { bookingId, userId },
      include: { booking: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    if (this.stripe) {
      if (!payment.stripeIntentId) {
        throw new BadRequestException('Payment intent missing');
      }
      const intent = await this.stripe.paymentIntents.retrieve(payment.stripeIntentId);
      if (intent.status !== 'succeeded') {
        throw new BadRequestException('Payment has not been completed yet');
      }
    } else {
      const allowDev =
        this.config.get('NODE_ENV') !== 'production' &&
        this.config.get('ALLOW_DEV_PAYMENT_CONFIRM') !== 'false';
      if (!allowDev) {
        throw new BadRequestException(
          'Online payments are not configured. Set STRIPE_SECRET_KEY to enable checkout.',
        );
      }
    }

    await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'SUCCEEDED' } });
    await this.prisma.booking.update({ where: { id: bookingId }, data: { status: 'CONFIRMED' } });
    await this.prisma.notification.create({
      data: {
        userId,
        title: 'Booking Confirmed',
        message: `Your booking ${payment.booking.reference} has been confirmed.`,
        type: 'success',
      },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (user?.email) {
      await this.mail.sendBookingConfirmation(user.email, payment.booking.reference, payment.amount).catch(() => undefined);
    }

    return { message: 'Payment confirmed', bookingId };
  }

  async getPaymentMethods(userId: string) {
    return this.prisma.paymentMethod.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async addPaymentMethod(userId: string, data: { brand: string; last4: string; expMonth: number; expYear: number }) {
    const allowDev =
      !this.stripe &&
      this.config.get('NODE_ENV') !== 'production' &&
      this.config.get('ALLOW_DEV_PAYMENT_CONFIRM') !== 'false';
    if (!this.stripe && !allowDev) {
      throw new BadRequestException('Saved cards require Stripe configuration');
    }
    return this.prisma.paymentMethod.create({ data: { userId, ...data } });
  }

  async deletePaymentMethod(id: string, userId: string) {
    return this.prisma.paymentMethod.deleteMany({ where: { id, userId } });
  }
}
