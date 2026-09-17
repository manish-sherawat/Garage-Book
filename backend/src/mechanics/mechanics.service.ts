import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMechanicDto } from './dto/create-mechanic.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MechanicsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateMechanicDto) {
    const email = `tech.${Date.now()}@garagebook.internal`;
    const password = await bcrypt.hash('default_password_123', 10);

    const mechanic = await this.prisma.user.create({
      data: {
        name: dto.name,
        email,
        password,
        role: dto.role || 'MECHANIC',
        mechanicProfile: {
          create: {
            phone: dto.phone,
            specialty: dto.specialty,
            experienceYears: dto.experienceYears ? Number(dto.experienceYears) : 1,
            shiftHours: dto.shiftHours,
            dailySalary: dto.dailySalary ? Number(dto.dailySalary) : 850,
            monthlySalary: dto.monthlySalary ? Number(dto.monthlySalary) : (dto.dailySalary ? Number(dto.dailySalary) * 30 : 25500),
          }
        }
      },
      include: {
        mechanicProfile: true
      }
    });

    return mechanic;
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      where: { role: 'MECHANIC', deletedAt: null },
      include: {
        mechanicProfile: {
          include: {
            jobs: {
              include: { vehicle: true, customer: true, invoices: true },
            },
            bayAllocations: {
              include: { bay: true },
              where: { actualEndTime: null },
            },
            attendance: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map(user => {
      const profile = user.mechanicProfile || {} as any;
      return {
        ...user,
        phone: profile.phone,
        specialty: profile.specialty,
        experienceYears: profile.experienceYears,
        shiftHours: profile.shiftHours,
        dailySalary: profile.dailySalary,
        monthlySalary: profile.monthlySalary,
        rating: profile.rating,
        jobs: profile.jobs || [],
        bayAllocations: profile.bayAllocations || [],
        attendance: profile.attendance || [],
      };
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Mechanic ${id} not found`);
    }
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  async update(id: string, dto: any) {
    const user = await this.prisma.user.findUnique({ where: { id }, include: { mechanicProfile: true } });
    if (!user) throw new NotFoundException(`Mechanic ${id} not found`);
    return this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name : undefined,
        role: dto.role !== undefined ? dto.role : undefined,
        mechanicProfile: {
          upsert: {
            create: {
              phone: dto.phone,
              specialty: dto.specialty,
              experienceYears: dto.experienceYears ? Number(dto.experienceYears) : 1,
              shiftHours: dto.shiftHours,
              dailySalary: dto.dailySalary ? Number(dto.dailySalary) : 850,
            },
            update: {
              phone: dto.phone !== undefined ? dto.phone : undefined,
              specialty: dto.specialty !== undefined ? dto.specialty : undefined,
              experienceYears: dto.experienceYears !== undefined ? Number(dto.experienceYears) : undefined,
              shiftHours: dto.shiftHours !== undefined ? dto.shiftHours : undefined,
              dailySalary: dto.dailySalary !== undefined ? Number(dto.dailySalary) : undefined,
              monthlySalary: dto.monthlySalary !== undefined ? Number(dto.monthlySalary) : undefined,
            }
          }
        }
      },
    });
  }

  async saveAttendance(date: string, attendanceData: Record<string, string>) {
    // attendanceData is an object mapping userId -> status
    const userIds = Object.keys(attendanceData);
    const profiles = await this.prisma.mechanicProfile.findMany({ where: { userId: { in: userIds } } });
    const userToProfile = Object.fromEntries(profiles.map(p => [p.userId, p.id]));

    const promises = Object.entries(attendanceData).map(([userId, status]) => {
      const mechanicId = userToProfile[userId];
      if (!mechanicId) return Promise.resolve();

      return this.prisma.attendance.upsert({
        where: {
          mechanicId_date: {
            mechanicId,
            date: new Date(date),
          },
        },
        update: { status },
        create: {
          mechanicId,
          date: new Date(date),
          status,
        },
      });
    });

    await Promise.all(promises);
    return { success: true, count: promises.length };
  }
}
