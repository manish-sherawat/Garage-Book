import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobCardDto } from './dto/create-job-card.dto';
import { UpdateJobCardDto } from './dto/update-job-card.dto';

@Injectable()
export class JobCardsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateJobCardDto) {
    let customerId = dto.customerId;
    if (!customerId) {
      const customerPhone = dto.phone || `CUST_${Date.now()}`;
      let customer = await this.prisma.customer.findUnique({
        where: { phone: customerPhone },
      });
      if (!customer) {
        customer = await this.prisma.customer.create({
          data: {
            name: dto.customerName || 'Walk-in Customer',
            phone: customerPhone,
          },
        });
      }
      customerId = customer.id;
    }

    let vehicleId = dto.vehicleId;
    if (!vehicleId) {
      const regNo = dto.registrationNo || `REG_${Date.now().toString().slice(-6)}`;
      let vehicle = await this.prisma.vehicle.findUnique({
        where: { registrationNo: regNo },
      });
      if (!vehicle) {
        vehicle = await this.prisma.vehicle.create({
          data: {
            registrationNo: regNo,
            make: dto.vehicleModel ? dto.vehicleModel.split(' ')[0] : 'Generic',
            model: dto.vehicleModel || 'Car',
            fuelType: 'PETROL',
            customerId: customerId,
          },
        });
      }
      vehicleId = vehicle.id;
    }

    // Lookup Mechanic by Name if mechanicName is provided
    let mechanicId = null;
    if (dto.mechanicName) {
      const mechanic = await this.prisma.user.findFirst({
        where: { name: dto.mechanicName, role: 'MECHANIC' },
      });
      if (mechanic) {
        mechanicId = mechanic.id;
      }
    }

    // Pre-check inventory quantities
    if (dto.parts && Array.isArray(dto.parts)) {
      for (const part of dto.parts) {
        if (part.partId) {
          const invItem = await this.prisma.inventoryItem.findUnique({ where: { id: part.partId } });
          if (!invItem) {
            throw new BadRequestException(`Part ${part.name || part.partId} not found in inventory.`);
          }
          if (invItem.quantity < part.qty) {
            throw new BadRequestException(`Insufficient stock for part "${invItem.name}". Available: ${invItem.quantity}, Requested: ${part.qty}`);
          }
        }
      }
    }

    // 3. Create Job Card
    const count = await this.prisma.jobCard.count();
    const jobNo = `GB-JOB-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const jobCard = await this.prisma.jobCard.create({
      data: {
        description: dto.description || 'General Service Inspection',
        status: dto.status || 'PENDING',
        customerId: customerId,
        vehicleId: vehicleId,
        mechanicId: mechanicId,
        estimatedCost: dto.estimatedCost,
        jobNo,
      },
      include: {
        customer: true,
        vehicle: true,
        mechanic: true,
      },
    });

    // 4. Decrement inventory quantities for used parts
    if (dto.parts && Array.isArray(dto.parts)) {
      for (const part of dto.parts) {
        if (part.partId) {
          try {
            const result = await this.prisma.inventoryItem.updateMany({
              where: { 
                id: part.partId,
                quantity: { gte: part.qty }
              },
              data: { quantity: { decrement: part.qty } },
            });
            if (result.count === 0) {
              console.warn(`Insufficient stock for part ${part.partId} to decrement by ${part.qty}`);
            }
          } catch (err) {
            console.warn(`Could not decrement inventory for part ${part.partId}:`, err);
          }
        }
      }
    }

    return jobCard;
  }

  async findAll(skip?: number, take?: number) {
    return this.prisma.jobCard.findMany({
      where: { deletedAt: null },
      skip,
      take,
      include: {
        customer: true,
        vehicle: true,
        mechanic: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const jobCard = await this.prisma.jobCard.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        mechanic: true,
        payments: true,
      },
    });

    if (!jobCard) {
      throw new NotFoundException(`Job card ${id} not found`);
    }
    return jobCard;
  }

  async update(id: string, dto: UpdateJobCardDto) {
    return this.prisma.jobCard.update({
      where: { id },
      data: {
        status: dto.status,
        description: dto.description,
      },
      include: {
        customer: true,
        vehicle: true,
        mechanic: true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.jobCard.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
