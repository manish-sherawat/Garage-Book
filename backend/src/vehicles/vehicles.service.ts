import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.vehicle.findMany({
      include: {
        customer: true,
        jobCards: {
          orderBy: { createdAt: 'desc' },
          include: {
            payments: true
          }
        }
      }
    });
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: { customer: true }
    });
    if (!vehicle) throw new NotFoundException(`Vehicle ${id} not found`);
    return vehicle;
  }

  async create(data: CreateVehicleDto) {
    return this.prisma.vehicle.create({
      data: {
        registrationNo: data.registrationNo,
        make: data.make,
        model: data.model,
        fuelType: data.fuelType,
        year: data.year,
        color: data.color,
        odometer: data.odometer,
        customerId: data.customerId
      }
    });
  }

  async update(id: string, data: UpdateVehicleDto) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException(`Vehicle ${id} not found`);
    
    return this.prisma.vehicle.update({
      where: { id },
      data: {
        registrationNo: data.registrationNo !== undefined ? data.registrationNo : undefined,
        make: data.make !== undefined ? data.make : undefined,
        model: data.model !== undefined ? data.model : undefined,
        fuelType: data.fuelType !== undefined ? data.fuelType : undefined,
        year: data.year !== undefined ? data.year : undefined,
        color: data.color !== undefined ? data.color : undefined,
        odometer: data.odometer !== undefined ? data.odometer : undefined,
        customerId: data.customerId !== undefined ? data.customerId : undefined,
      }
    });
  }

  async remove(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException(`Vehicle ${id} not found`);
    return this.prisma.vehicle.delete({ where: { id } });
  }
}
