import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { PaymentsService, CreatePaymentDto, GenerateUpiQrDto } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('generate-upi-qr')
  generateUpiQr(@Body() dto: GenerateUpiQrDto) {
    return this.paymentsService.generateUpiQrData(dto);
  }

  @Post()
  createPayment(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.createPayment(dto);
  }

  @Get()
  getAllPayments(@Query('timeRange') timeRange?: string) {
    return this.paymentsService.getAllPayments(timeRange);
  }

  @Get('job-card/:jobCardId')
  getPaymentsByJobCard(@Param('jobCardId') jobCardId: string) {
    return this.paymentsService.getPaymentsByJobCard(jobCardId);
  }
}
