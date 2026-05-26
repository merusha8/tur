import { IsEmail, IsString } from 'class-validator';

export class VerifyDto {
  @IsEmail()
  email!: string;

  @IsString()
  code!: string;
}
