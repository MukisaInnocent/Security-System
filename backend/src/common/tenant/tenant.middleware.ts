import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { tenantContext } from './tenant.context';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    let tenantId: string | undefined = undefined;

    // 1. Try to get tenantId from JWT Token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = this.jwtService.decode(token) as any;
        if (decoded && decoded.tenantId) {
          tenantId = decoded.tenantId;
        }
      } catch (err) {
        // Ignore jwt errors here, AuthGuard will handle them later
      }
    }

    // 2. Fallback to custom header (useful for Super Admin testing or S2S)
    if (!tenantId && req.headers['x-tenant-id']) {
      tenantId = req.headers['x-tenant-id'] as string;
    }

    // Run the rest of the request within the AsyncLocalStorage context
    if (tenantId) {
      tenantContext.run({ tenantId }, () => next());
    } else {
      // If no tenant context, still run, but tenantId will be undefined
      tenantContext.run({ tenantId: '' }, () => next());
    }
  }
}
