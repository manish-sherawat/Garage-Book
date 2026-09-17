import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { DashboardController } from './dashboard.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { JobCardsModule } from './job-cards/job-cards.module';
import { PaymentsModule } from './payments/payments.module';
import { ProcurementModule } from './procurement/procurement.module';
import { WorkshopBaysModule } from './workshop-bays/workshop-bays.module';
import { AccountingModule } from './accounting/accounting.module';
import { CustomersModule } from './customers/customers.module';
import { MechanicsModule } from './mechanics/mechanics.module';
import { BillingModule } from './billing/billing.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { AuthModule } from './auth/auth.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    CacheModule.register({ isGlobal: true, ttl: 30000 }),
    PrismaModule,
    AuthModule,
    JobCardsModule,
    PaymentsModule,
    ProcurementModule,
    WorkshopBaysModule,
    AccountingModule,
    CustomersModule,
    MechanicsModule,
    BillingModule,
    VehiclesModule,
    SettingsModule,
  ],
  controllers: [AppController, DashboardController],
  providers: [AppService],
})
export class AppModule {}
