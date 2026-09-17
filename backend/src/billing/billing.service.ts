import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class CreateInvoiceDto {
  customerName: string;
  vehicleNo: string;
  partsTotal: number;
  laborTotal: number;
  taxAmount: number;
  taxRate?: number;
  grandTotal: number;
  jobCardId?: string;
}

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInvoiceDto) {
    const count = await this.prisma.invoice.count();
    const invoiceNo = `GB-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    return this.prisma.invoice.create({
      data: {
        invoiceNo,
        customerName: dto.customerName,
        vehicleNo: dto.vehicleNo,
        partsTotal: dto.partsTotal,
        laborTotal: dto.laborTotal,
        taxAmount: dto.taxAmount,
        taxRate: dto.taxRate ?? 18,
        grandTotal: dto.grandTotal,
        jobCardId: dto.jobCardId,
        status: 'UNPAID',
      },
    });
  }

  async findAll(skip?: number, take?: number) {
    return this.prisma.invoice.findMany({
      where: { deletedAt: null },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.invoice.update({
      where: { id },
      data: { status },
    });
  }
}
