import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
export enum BayStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
}

export class CreateBayDto {
  bayNumber: string;
  name: string;
  bayType?: string;
}

export class AllocateBayDto {
  bayId: string;
  jobCardId: string;
  mechanicId?: string;
  estimatedHours?: number;
}

@Injectable()
export class WorkshopBaysService {
  constructor(private prisma: PrismaService) {}

  async createBay(dto: CreateBayDto) {
    return this.prisma.serviceBay.create({ data: dto });
  }

  async getAllBays() {
    let bays = await this.prisma.serviceBay.findMany({
      include: {
        allocations: {
          include: {
            jobCard: {
              include: {
                vehicle: true,
                customer: true,
              },
            },
            mechanic: true,
          },
          where: {
            actualEndTime: null, // active allocation
          },
        },
      },
      orderBy: { bayNumber: 'asc' },
    });

    if (bays.length === 0) {
      // Auto-seed default workshop bays
      await this.prisma.serviceBay.createMany({
        data: [
          { bayNumber: 'BAY-01', bayType: 'General Express Service Bay' },
          { bayNumber: 'BAY-02', bayType: 'Engine Diagnostic & Tuning Bay' },
          { bayNumber: 'BAY-03', bayType: 'Wheel Alignment & Balancing Bay' },
          { bayNumber: 'BAY-04', bayType: 'Heavy Repair & Overhaul Bay' },
          { bayNumber: 'BAY-05', bayType: 'Washing & Detailing Bay' },
        ],
      });
      bays = await this.prisma.serviceBay.findMany({
        include: {
          allocations: {
            include: {
              jobCard: {
                include: {
                  vehicle: true,
                  customer: true,
                },
              },
              mechanic: true,
            },
            where: {
              actualEndTime: null,
            },
          },
        },
        orderBy: { bayNumber: 'asc' },
      });
    }

    return bays;
  }

  async allocateBay(dto: AllocateBayDto) {
    const bay = await this.prisma.serviceBay.findUnique({
      where: { id: dto.bayId },
    });

    if (!bay) {
      throw new NotFoundException(`Service Bay ${dto.bayId} not found`);
    }

    const estimatedEndTime = dto.estimatedHours
      ? new Date(Date.now() + dto.estimatedHours * 3600 * 1000)
      : undefined;

    await this.prisma.$transaction(async (tx) => {
      // Ensure jobCard exists
      let jobCard = await tx.jobCard.findUnique({
        where: { id: dto.jobCardId },
      });

      if (!jobCard) {
        throw new NotFoundException(`JobCard ${dto.jobCardId} not found or missing`);
      }

      // Mark bay occupied
      await tx.serviceBay.update({
        where: { id: dto.bayId },
        data: { status: BayStatus.OCCUPIED },
      });

      // Create allocation record
      await tx.bayAllocation.create({
        data: {
          bayId: dto.bayId,
          jobCardId: jobCard.id,
          mechanicId: dto.mechanicId,
          estimatedEndTime,
        },
      });

      // Update job status to IN_PROGRESS
      await tx.jobCard.update({
        where: { id: jobCard.id },
        data: {
          status: 'IN_PROGRESS',
          mechanicId: dto.mechanicId || undefined,
        },
      });
    });

    return this.getAllBays();
  }

  async releaseBay(bayId: string) {
    await this.prisma.$transaction(async (tx) => {
      // Find active allocation
      const activeAlloc = await tx.bayAllocation.findFirst({
        where: { bayId, actualEndTime: null },
      });

      if (activeAlloc) {
        await tx.bayAllocation.update({
          where: { id: activeAlloc.id },
          data: { actualEndTime: new Date() },
        });
      }

      await tx.serviceBay.update({
        where: { id: bayId },
        data: { status: BayStatus.AVAILABLE },
      });
    });

    return this.getAllBays();
  }

  async updateBayStatus(id: string, status: BayStatus) {
    return this.prisma.serviceBay.update({
      where: { id },
      data: { status },
    });
  }
}
