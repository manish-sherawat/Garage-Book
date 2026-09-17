import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { BillingService, CreateInvoiceDto } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('invoices')
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.billingService.create(createInvoiceDto);
  }

  @Get('invoices')
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.billingService.findAll(
      skip ? parseInt(skip, 10) : undefined,
      take ? parseInt(take, 10) : undefined
    );
  }

  @Patch('invoices/:id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.billingService.updateStatus(id, status);
  }
}
