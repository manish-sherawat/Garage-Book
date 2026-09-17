import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCustomerDto) {
    // Upsert customer by phone
    let customer = await this.prisma.customer.findUnique({
      where: { phone: dto.phone },
    });

    if (customer) {
      customer = await this.prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: dto.name || customer.name,
          email: dto.email || customer.email,
          address: dto.address || customer.address,
          gender: dto.gender || customer.gender,
        },
      });
    } else {
      customer = await this.prisma.customer.create({
        data: {
          name: dto.name,
          phone: dto.phone,
          email: dto.email,
          address: dto.address,
          gender: dto.gender,
        },
      });
    }

    // Attach vehicles if provided
    if (dto.vehicles && dto.vehicles.length > 0) {
      for (const v of dto.vehicles) {
        if (!v.registrationNo) continue;
        const existingVehicle = await this.prisma.vehicle.findUnique({
          where: { registrationNo: v.registrationNo },
        });

        if (!existingVehicle) {
          await this.prisma.vehicle.create({
            data: {
              registrationNo: v.registrationNo,
              make: v.make || v.model?.split(' ')[0] || 'Generic',
              model: v.model || 'Vehicle',
              fuelType: v.fuelType || 'PETROL',
              customerId: customer.id,
            },
          });
        }
      }
    }

    return this.findOne(customer.id);
  }

  async findAll(skip?: number, take?: number) {
    return this.prisma.customer.findMany({
      where: { deletedAt: null },
      skip,
      take,
      include: {
        vehicles: true,
        jobCards: {
          include: {
            payments: true,
            vehicle: true,
            mechanic: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        vehicles: true,
        jobCards: {
          include: {
            payments: true,
            vehicle: true,
            mechanic: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }

    return customer;
  }

  async update(id: string, dto: Partial<CreateCustomerDto>) {
    return this.prisma.customer.update({
      where: { id },
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        gender: dto.gender,
      },
      include: { vehicles: true },
    });
  }

  async remove(id: string) {
    return this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
