import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('intent')
  createIntent(@CurrentUser() user: { id: string }, @Body() body: { bookingId: string; amount: number }) {
    return this.paymentsService.createPaymentIntent(user.id, body.bookingId, body.amount);
  }

  @Post('confirm')
  confirm(@CurrentUser() user: { id: string }, @Body() body: { bookingId: string }) {
    return this.paymentsService.confirmPayment(body.bookingId, user.id);
  }

  @Get('methods')
  getMethods(@CurrentUser() user: { id: string }) {
    return this.paymentsService.getPaymentMethods(user.id);
  }

  @Get('config')
  getConfig() {
    return {
      stripeConfigured: this.paymentsService.isStripeConfigured(),
      devMode:
        !this.paymentsService.isStripeConfigured() &&
        process.env.NODE_ENV !== 'production' &&
        process.env.ALLOW_DEV_PAYMENT_CONFIRM !== 'false',
    };
  }

  @Post('methods')
  addMethod(@CurrentUser() user: { id: string }, @Body() body: { brand: string; last4: string; expMonth: number; expYear: number }) {
    return this.paymentsService.addPaymentMethod(user.id, body);
  }

  @Delete('methods/:id')
  deleteMethod(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.paymentsService.deletePaymentMethod(id, user.id);
  }
}
