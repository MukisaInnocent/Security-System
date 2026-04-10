import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SitesModule } from './sites/sites.module';
import { DeploymentsModule } from './deployments/deployments.module';
import { AttendanceModule } from './attendance/attendance.module';
import { IncidentsModule } from './incidents/incidents.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { RegionsModule } from './regions/regions.module';
import { PostsModule } from './posts/posts.module';
import { HrModule } from './hr/hr.module';
import { ArmouryModule } from './armoury/armoury.module';
import { ProcurementModule } from './procurement/procurement.module';
import { LogisticsModule } from './logistics/logistics.module';
import { FinanceModule } from './finance/finance.module';
import { SpecialDutyModule } from './special-duty/special-duty.module';
import { PayrollModule } from './payroll/payroll.module';
import { SpotCheckModule } from './spot-check/spot-check.module';
import { FoodSupplierModule } from './food-supplier/food-supplier.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    SitesModule,
    DeploymentsModule,
    AttendanceModule,
    IncidentsModule,
    DashboardModule,
    NotificationsModule,
    AnalyticsModule,
    RegionsModule,
    PostsModule,
    HrModule,
    ArmouryModule,
    ProcurementModule,
    LogisticsModule,
    FinanceModule,
    SpecialDutyModule,
    PayrollModule,
    SpotCheckModule,
    FoodSupplierModule,
    ChatModule,
  ],
})
export class AppModule {}
