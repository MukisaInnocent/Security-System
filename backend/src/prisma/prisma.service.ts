import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { getTenantId } from '../common/tenant/tenant.context';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Define models that are NOT tenant isolated
  private readonly globalModels = [
    'Tenant',
    'SubscriptionPlan',
    'User',
  ];

  public get tx() {
    return this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const tenantId = getTenantId();
            
            // If no tenant context, or model is global, proceed normally
            if (!tenantId || ['Tenant', 'SubscriptionPlan', 'User'].includes(model)) {
              return query(args);
            }

            // Methods that don't need tenant filtering or can't be easily filtered
            if (['create', 'createMany', 'count'].includes(operation)) {
                if (operation === 'create' || operation === 'createMany') {
                    // Inject tenantId on creation
                    if (args.data && !Array.isArray(args.data)) {
                        args.data.tenantId = tenantId;
                    } else if (Array.isArray(args.data)) {
                        args.data = args.data.map(d => ({...d, tenantId}));
                    }
                }
                if (operation === 'count' && !args.where?.tenantId) {
                    args.where = { ...args.where, tenantId };
                }
                return query(args);
            }

            // Apply tenant filtering for reads/updates/deletes
            const tenantFilter = { tenantId };

            if (args.where) {
              args.where = { ...args.where, ...tenantFilter };
            } else {
              args.where = tenantFilter;
            }

            return query(args);
          },
        },
      },
    });
  }
}
