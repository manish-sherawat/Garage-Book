import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
export enum PaymentMethod {
  UPI = 'UPI',
  CARD = 'CARD',
  CASH = 'CASH',
  NETBANKING = 'NETBANKING',
  SPLIT = 'SPLIT',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  jobCardId: string;

  @IsNumber()
  amount: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class GenerateUpiQrDto {
  @IsString()
  payeeVpa: string;

  @IsString()
  payeeName: string;

  @IsNumber()
  amount: number;

  @IsString()
  transactionNote: string;
}

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  generateUpiQrData(dto: GenerateUpiQrDto) {
    const { payeeVpa, payeeName, amount, transactionNote } = dto;
    const upiUri = `upi://pay?pa=${encodeURIComponent(payeeVpa)}&pn=${encodeURIComponent(
      payeeName,
    )}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
    
    return {
      upiUri,
      qrCodeDataUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`,
      payeeVpa,
      amount,
    };
  }

  async createPayment(dto: CreatePaymentDto) {
    const jobCardId = dto.jobCardId;

    if (jobCardId === 'GENERAL') {
      // In a robust system, we would create a separate Invoice or CounterSale model.
      // For now, if the frontend sends GENERAL, we'll allow an orphaned payment 
      // without creating fake customers or vehicles.
    } else {
      const jobCard = await this.prisma.jobCard.findUnique({
        where: { id: jobCardId },
      });

      if (!jobCard) {
        throw new NotFoundException(`Job card ${jobCardId} not found`);
      }
    }

    let upiQrData: string | undefined;
    if (dto.paymentMethod === PaymentMethod.UPI) {
      const upiRes = this.generateUpiQrData({
        payeeVpa: 'garagebook@upi',
        payeeName: 'GarageBook Workshop',
        amount: dto.amount,
        transactionNote: `Payment for ${jobCardId === 'GENERAL' ? 'Counter Billing' : `Job ${jobCardId.substring(0, 8)}`}`,
      });
      upiQrData = upiRes.upiUri;
    }

    const payment = await this.prisma.payment.create({
      data: {
        jobCardId: jobCardId === 'GENERAL' ? undefined : dto.jobCardId,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        status: dto.status || PaymentStatus.COMPLETED,
        transactionId: dto.transactionId || `TXN_${Date.now()}`,
        notes: dto.notes,
        upiQrData,
      },
    });

    return payment;
  }

  async getPaymentsByJobCard(jobCardId: string) {
    return this.prisma.payment.findMany({
      where: { jobCardId },
      orderBy: { createdAt: 'desc' },
    });
  }

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

  async getAllPayments(timeRange?: string) {
    const dateFilter = this.getDateFilter(timeRange);
    return this.prisma.payment.findMany({
      where: dateFilter ? { createdAt: dateFilter } : undefined,
      include: {
        jobCard: {
          include: {
            customer: true,
            vehicle: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
