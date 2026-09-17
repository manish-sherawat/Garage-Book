import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getAllSettings() {
    const settings = await this.prisma.setting.findMany();
    const result: Record<string, any> = {};
    for (const setting of settings) {
      try {
        result[setting.key] = JSON.parse(setting.value);
      } catch {
        result[setting.key] = setting.value;
      }
    }
    return result;
  }

  async updateSettings(data: Record<string, any>) {
    const updates = Object.entries(data).map(([key, value]) => {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      return this.prisma.setting.upsert({
        where: { key },
        update: { value: stringValue },
        create: { key, value: stringValue },
      });
    });

    await this.prisma.$transaction(updates);
    return { success: true, message: 'Settings updated successfully' };
  }
}
