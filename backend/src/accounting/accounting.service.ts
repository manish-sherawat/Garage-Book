import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  private getDateFilter(timeRange?: string) {
    if (!timeRange || timeRange === 'ALL_TIME') return undefined;
    const now = new Date();
    if (timeRange === 'THIS_MONTH') {
      return { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
    }
    if (timeRange === 'LAST_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { gte: firstDay, lte: lastDay };
    }
    if (timeRange === 'YEAR_TO_DATE') {
      return { gte: new Date(now.getFullYear(), 0, 1) };
    }
    return undefined;
  }

  async getFinancialSummary(timeRange?: string) {
    const dateFilter = this.getDateFilter(timeRange);

    const payments = await this.prisma.payment.findMany({
      where: dateFilter ? { createdAt: dateFilter } : undefined,
    });
    
    const invoices = await this.prisma.invoice.findMany({
      where: dateFilter ? { createdAt: dateFilter } : undefined,
    });
    
    const purchaseOrders = await this.prisma.purchaseOrder.findMany({
      where: { 
        status: 'RECEIVED',
        ...(dateFilter ? { createdAt: dateFilter } : {})
      },
    });

    const mechanics = await this.prisma.user.findMany({
      where: { role: 'MECHANIC' },
      include: {
        mechanicProfile: {
          include: {
            attendance: {
              where: {
                status: 'PRESENT',
                ...(dateFilter ? { createdAt: dateFilter } : {})
              }
            }
          }
        }
      }
    });

    const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
    const totalProcurementExpense = purchaseOrders.reduce((acc, po) => acc + po.totalAmount, 0);
    
    // Calculate total labour cost using actual attendance data
    const totalLabourCost = mechanics.reduce((acc, m) => {
      const profile = m.mechanicProfile || {} as any;
      const attendance = profile.attendance || [];
      const daysPresent = attendance.length;
      const dailyRate = profile.dailySalary || ((profile.monthlySalary || 0) / 30);
      return acc + (daysPresent * dailyRate);
    }, 0);
    
    const netProfit = totalRevenue - totalProcurementExpense - totalLabourCost;

    // GST exact calculation from Invoices
    const totalGstCollected = invoices.reduce((acc, inv) => acc + inv.taxAmount, 0);
    const taxableRevenue = invoices.reduce((acc, inv) => acc + (inv.grandTotal - inv.taxAmount), 0);
    const cgst = totalGstCollected / 2;
    const sgst = totalGstCollected / 2;

    return {
      totalRevenue,
      totalProcurementExpense,
      totalLabourCost,
      netProfit,
      taxSummary: {
        totalGstCollected,
        cgst,
        sgst,
        igst: 0,
        taxableRevenue,
      },
      paymentBreakdown: {
        upi: payments.filter((p) => p.paymentMethod === 'UPI').reduce((a, b) => a + b.amount, 0),
        card: payments.filter((p) => p.paymentMethod === 'CARD').reduce((a, b) => a + b.amount, 0),
        cash: payments.filter((p) => p.paymentMethod === 'CASH').reduce((a, b) => a + b.amount, 0),
        netbanking: payments.filter((p) => p.paymentMethod === 'NETBANKING').reduce((a, b) => a + b.amount, 0),
      },
    };
  }

  async exportCsvReport() {
    const payments = await this.prisma.payment.findMany({
      include: { jobCard: true },
    });

    let csv = 'Payment ID,Job Card ID,Amount (INR),Payment Method,Status,Transaction ID,Date\n';
    payments.forEach((p) => {
      csv += `"${p.id}","${p.jobCardId}",${p.amount},"${p.paymentMethod}","${p.status}","${p.transactionId || ''}","${p.createdAt.toISOString()}"\n`;
    });

    return csv;
  }
}
