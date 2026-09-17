import { Controller, Get, Res, Query } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import type { Response } from 'express';

@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('summary')
  getFinancialSummary(@Query('timeRange') timeRange?: string) {
    return this.accountingService.getFinancialSummary(timeRange);
  }

  @Get('export-csv')
  async exportCsv(@Res() res: Response) {
    const csv = await this.accountingService.exportCsvReport();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="financial_report.csv"');
    return res.send(csv);
  }
}
