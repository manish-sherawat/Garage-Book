import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
export enum POStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

export class CreateSupplierDto {
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  gstin?: string;
  address?: string;
}

export class POItemDto {
  inventoryItemId: string;
  quantity: number;
  unitCost: number;
}

export class CreatePODto {
  supplierId: string;
  expectedDelivery?: string;
  items: POItemDto[];
  status?: POStatus;
}

@Injectable()
export class ProcurementService {
  constructor(private prisma: PrismaService) {}

  // Suppliers
  async createSupplier(dto: CreateSupplierDto) {
    return this.prisma.supplier.create({ data: dto });
  }

  async getAllSuppliers() {
    return this.prisma.supplier.findMany({
      include: {
        _count: {
          select: { purchaseOrders: true, inventory: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllInventory(skip?: number, take?: number) {
    return this.prisma.inventoryItem.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createInventoryItem(dto: { name: string; partNumber: string; quantity: number; minQuantity: number; price: number }) {
    const existing = await this.prisma.inventoryItem.findFirst({ where: { name: dto.name } });
    if (existing) {
      throw new BadRequestException(`Part name "${dto.name}" already exists in inventory.`);
    }
    try {
      return await this.prisma.inventoryItem.create({
        data: {
          name: dto.name,
          partNumber: dto.partNumber,
          quantity: dto.quantity,
          minQuantity: dto.minQuantity,
          price: dto.price,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Part number already exists. Please use a unique part number.');
      }
      throw error;
    }
  }

  async updateInventoryItem(id: string, dto: { name?: string; partNumber?: string; quantity?: number; minQuantity?: number; price?: number }) {
    if (dto.name) {
      const existing = await this.prisma.inventoryItem.findFirst({ where: { name: dto.name } });
      if (existing && existing.id !== id) {
        throw new BadRequestException(`Part name "${dto.name}" already exists in inventory.`);
      }
    }
    return this.prisma.inventoryItem.update({
      where: { id },
      data: dto,
    });
  }

  async deleteInventoryItem(id: string) {
    return this.prisma.inventoryItem.delete({
      where: { id },
    });
  }

  async bulkCreateInventoryItems(items: Array<{ name: string; partNumber: string; quantity: number; minQuantity: number; price: number }>) {
    return this.prisma.inventoryItem.createMany({
      data: items,
      skipDuplicates: true,
    });
  }

  // Purchase Orders
  async createPurchaseOrder(dto: CreatePODto) {
    const count = await this.prisma.purchaseOrder.count();
    const poNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    let totalAmount = 0;
    
    dto.items.forEach((item) => {
      totalAmount += item.quantity * item.unitCost;
    });

    return this.prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: dto.supplierId,
        totalAmount,
        status: dto.status || POStatus.DRAFT,
        expectedDelivery: dto.expectedDelivery ? new Date(dto.expectedDelivery) : undefined,
        items: {
          create: dto.items.map((i) => ({
            inventoryItemId: i.inventoryItemId,
            quantity: i.quantity,
            unitCost: i.unitCost,
          })),
        },
      },
      include: {
        supplier: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });
  }

  async getAllPurchaseOrders() {
    return this.prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markPOReceived(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!po) {
      throw new NotFoundException(`Purchase order with ID ${id} not found`);
    }

    if (po.status === POStatus.RECEIVED) {
      return po; // P-04: Prevent double-incrementing stock
    }

    return this.prisma.$transaction(async (tx) => {
      for (const item of po.items) {
        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        });
      }

      await tx.purchaseOrder.update({
        where: { id },
        data: { status: POStatus.RECEIVED },
      });
    });

    return this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { supplier: true, items: { include: { inventoryItem: true } } },
    });
  }

  async cancelPurchaseOrder(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new NotFoundException('PO not found');
    if (po.status === POStatus.RECEIVED) {
      throw new BadRequestException('Cannot cancel a received purchase order');
    }
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: POStatus.CANCELLED },
    });
  }
}
