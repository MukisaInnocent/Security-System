import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContextData {
  tenantId: string;
}

export const tenantContext = new AsyncLocalStorage<TenantContextData>();

export function getTenantId(): string | undefined {
  const store = tenantContext.getStore();
  return store?.tenantId;
}
