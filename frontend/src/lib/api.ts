const getApiBase = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    const normalized = envUrl.replace(/\/$/, '');
    return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:3001/api`;
    }

    console.warn(
      'NEXT_PUBLIC_API_URL is not configured. Falling back to frontend origin /api. ' +
      'This is only correct if the backend is proxied through the same hostname.',
    );

    const origin = port ? `${protocol}//${hostname}:${port}` : `${protocol}//${hostname}`;
    return `${origin}/api`;
  }

  return 'http://localhost:3001/api';
};
interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem('auth_token', token);
    else localStorage.removeItem('auth_token');
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  async fetch<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { skipAuth, ...fetchOptions } = options;
    const headers: Record<string, string> = {
      ...(fetchOptions.headers as Record<string, string> || {}),
    };
    if (!(fetchOptions.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    if (!skipAuth) { const token = this.getToken(); if (token) headers['Authorization'] = `Bearer ${token}`; }
    const response = await fetch(`${getApiBase()}${endpoint}`, { ...fetchOptions, headers });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'API Error');
    }
    return response.json();
  }

  // === AUTH ===
  async login(email: string, password: string) {
    const data = await this.fetch<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }), skipAuth: true,
    });
    this.setToken(data.access_token);
    return data;
  }
  logout() { this.setToken(null); }
  async getProfile() { return this.fetch('/auth/me'); }

  // === USERS ===
  async getUsers(role?: string) { return this.fetch(`/users${role ? `?role=${role}` : ''}`); }
  async createUser(data: any) { return this.fetch('/users', { method: 'POST', body: JSON.stringify(data) }); }
  async updateUser(id: string, data: any) { return this.fetch(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
  async deleteUser(id: string) { return this.fetch(`/users/${id}`, { method: 'DELETE' }); }

  // === SITES ===
  async getSites() { return this.fetch('/sites'); }
  async createSite(data: any) { return this.fetch('/sites', { method: 'POST', body: JSON.stringify(data) }); }
  async updateSite(id: string, data: any) { return this.fetch(`/sites/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }

  // === REGIONS ===
  async getRegions() { return this.fetch('/regions'); }
  async getRegion(id: string) { return this.fetch(`/regions/${id}`); }
  async getRegionDashboard(id: string) { return this.fetch(`/regions/${id}/dashboard`); }
  async createRegion(data: any) { return this.fetch('/regions', { method: 'POST', body: JSON.stringify(data) }); }
  async updateRegion(id: string, data: any) { return this.fetch(`/regions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }

  // === POSTS ===
  async getPosts(siteId?: string) { return this.fetch(`/posts${siteId ? `?siteId=${siteId}` : ''}`); }
  async createPost(data: any) { return this.fetch('/posts', { method: 'POST', body: JSON.stringify(data) }); }
  async updatePost(id: string, data: any) { return this.fetch(`/posts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }

  // === DEPLOYMENTS ===
  async getDeployments(filters?: Record<string, string>) {
    const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return this.fetch(`/deployments${params}`);
  }
  async createDeployment(data: any) { return this.fetch('/deployments', { method: 'POST', body: JSON.stringify(data) }); }
  async updateDeployment(id: string, data: any) { return this.fetch(`/deployments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }

  // === ATTENDANCE ===
  async checkIn(data: any) { return this.fetch('/attendance/check-in', { method: 'POST', body: JSON.stringify(data) }); }
  async checkOut(data: any) { return this.fetch('/attendance/check-out', { method: 'POST', body: JSON.stringify(data) }); }
  async getAttendance(filters?: Record<string, string>) {
    const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return this.fetch(`/attendance${params}`);
  }
  async syncAttendance(records: any[]) { return this.fetch('/attendance/sync', { method: 'POST', body: JSON.stringify({ records }) }); }

  // === INCIDENTS ===
  async createIncident(data: any) {
    if (data instanceof FormData) return this.fetch('/incidents', { method: 'POST', body: data });
    return this.fetch('/incidents', { method: 'POST', body: JSON.stringify(data) });
  }
  async getIncidents(filters?: Record<string, string>) {
    const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return this.fetch(`/incidents${params}`);
  }
  async assignIncident(id: string, assignedToId: string) { return this.fetch(`/incidents/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ assignedToId }) }); }
  async resolveIncident(id: string, resolutionNote: string) { return this.fetch(`/incidents/${id}/resolve`, { method: 'PATCH', body: JSON.stringify({ resolutionNote }) }); }
  async updateIncidentStatus(id: string, status: string) { return this.fetch(`/incidents/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); }
  async syncIncidents(records: any[]) { return this.fetch('/incidents/sync', { method: 'POST', body: JSON.stringify({ records }) }); }

  // === HR ===
  async getGuardProfiles() { return this.fetch('/hr/guards'); }
  async getGuardProfile(id: string) { return this.fetch(`/hr/guards/${id}`); }
  async upsertGuardProfile(id: string, data: any) { return this.fetch(`/hr/guards/${id}/profile`, { method: 'POST', body: JSON.stringify(data) }); }
  async updateWeaponAuthorisation(id: string, authorised: boolean) { return this.fetch(`/hr/guards/${id}/weapon-authorisation`, { method: 'PATCH', body: JSON.stringify({ authorised }) }); }
  async getWeaponAuthorisationRegistry() { return this.fetch('/hr/weapon-authorisation'); }
  async getLeaveRequests(status?: string) { return this.fetch(`/hr/leave-requests${status ? `?status=${status}` : ''}`); }
  async createLeaveRequest(data: any) { return this.fetch('/hr/leave-requests', { method: 'POST', body: JSON.stringify(data) }); }
  async approveLeaveRequest(id: string, approved: boolean, rejectReason?: string) { return this.fetch(`/hr/leave-requests/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ approved, rejectReason }) }); }

  // === ARMOURY ===
  async getWeapons(status?: string) { return this.fetch(`/armoury/weapons${status ? `?status=${status}` : ''}`); }
  async getWeapon(id: string) { return this.fetch(`/armoury/weapons/${id}`); }
  async createWeapon(data: any) { return this.fetch('/armoury/weapons', { method: 'POST', body: JSON.stringify(data) }); }
  async updateWeapon(id: string, data: any) { return this.fetch(`/armoury/weapons/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
  async getWeaponIssuances(params?: Record<string, string>) { return this.fetch(`/armoury/issuances${params ? '?' + new URLSearchParams(params) : ''}`); }
  async createWeaponIssuance(data: any) { return this.fetch('/armoury/issuances', { method: 'POST', body: JSON.stringify(data) }); }
  async returnWeapon(id: string, data: any) { return this.fetch(`/armoury/issuances/${id}/return`, { method: 'PATCH', body: JSON.stringify(data) }); }
  async getAmmunitionStock(siteId?: string) { return this.fetch(`/armoury/ammunition${siteId ? `?siteId=${siteId}` : ''}`); }
  async updateAmmunitionStock(data: any) { return this.fetch('/armoury/ammunition', { method: 'POST', body: JSON.stringify(data) }); }
  async getArmouryLicenceExpiryReport() { return this.fetch('/armoury/reports/licence-expiry'); }

  // === PROCUREMENT ===
  async getSuppliers() { return this.fetch('/procurement/suppliers'); }
  async createSupplier(data: any) { return this.fetch('/procurement/suppliers', { method: 'POST', body: JSON.stringify(data) }); }
  async updateSupplier(id: string, data: any) { return this.fetch(`/procurement/suppliers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
  async getPurchaseRequests(status?: string) { return this.fetch(`/procurement/requests${status ? `?status=${status}` : ''}`); }
  async createPurchaseRequest(data: any) { return this.fetch('/procurement/requests', { method: 'POST', body: JSON.stringify(data) }); }
  async approvePurchaseRequest(id: string, approved: boolean, rejectReason?: string) { return this.fetch(`/procurement/requests/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ approved, rejectReason }) }); }
  async getPurchaseOrders(status?: string) { return this.fetch(`/procurement/orders${status ? `?status=${status}` : ''}`); }
  async createPurchaseOrder(data: any) { return this.fetch('/procurement/orders', { method: 'POST', body: JSON.stringify(data) }); }
  async confirmDelivery(id: string) { return this.fetch(`/procurement/orders/${id}/deliver`, { method: 'PATCH' }); }

  // === LOGISTICS ===
  async getDistributions(siteId?: string) { return this.fetch(`/logistics/distributions${siteId ? `?siteId=${siteId}` : ''}`); }
  async createDistribution(data: any) { return this.fetch('/logistics/distributions', { method: 'POST', body: JSON.stringify(data) }); }
  async getSiteInventory(siteId?: string) { return this.fetch(`/logistics/inventory${siteId ? `?siteId=${siteId}` : ''}`); }
  async getLowStockAlerts() { return this.fetch('/logistics/alerts'); }
  async recordTransfer(data: any) { return this.fetch('/logistics/transfers', { method: 'POST', body: JSON.stringify(data) }); }

  // === FINANCE ===
  async getContracts(status?: string) { return this.fetch(`/finance/contracts${status ? `?status=${status}` : ''}`); }
  async getContract(id: string) { return this.fetch(`/finance/contracts/${id}`); }
  async getExpiringContracts() { return this.fetch('/finance/contracts/expiring'); }
  async createContract(data: any) { return this.fetch('/finance/contracts', { method: 'POST', body: JSON.stringify(data) }); }
  async updateContract(id: string, data: any) { return this.fetch(`/finance/contracts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
  async getInvoices(params?: Record<string, string>) { return this.fetch(`/finance/invoices${params ? '?' + new URLSearchParams(params) : ''}`); }
  async generateInvoice(data: any) { return this.fetch('/finance/invoices/generate', { method: 'POST', body: JSON.stringify(data) }); }
  async updateInvoice(id: string, data: any) { return this.fetch(`/finance/invoices/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
  async recordPayment(invoiceId: string, data: any) { return this.fetch(`/finance/invoices/${invoiceId}/payment`, { method: 'POST', body: JSON.stringify(data) }); }
  async generateInvoices() { return this.fetch('/finance/invoices/generate', { method: 'POST' }); }
  async getFinanceMonthlyReport(year: number, month: number) { return this.fetch(`/finance/reports/monthly?year=${year}&month=${month}`); }
  async getContractVsActual() { return this.fetch('/finance/reports/contract-vs-actual'); }

  // === SPECIAL DUTY ===
  async getSpecialDuties(status?: string) { return this.fetch(`/special-duty${status ? `?status=${status}` : ''}`); }
  async getSpecialDuty(id: string) { return this.fetch(`/special-duty/${id}`); }
  async createSpecialDuty(data: any) { return this.fetch('/special-duty', { method: 'POST', body: JSON.stringify(data) }); }
  async respondToSpecialDuty(id: string, confirmed: boolean, declineReason?: string) { return this.fetch(`/special-duty/${id}/respond`, { method: 'PATCH', body: JSON.stringify({ confirmed, declineReason }) }); }
  async markSpecialDutyAttendance(id: string, userId: string, attended: boolean) { return this.fetch(`/special-duty/${id}/attendance`, { method: 'PATCH', body: JSON.stringify({ userId, attended }) }); }
  async completeSpecialDuty(id: string) { return this.fetch(`/special-duty/${id}/complete`, { method: 'PATCH' }); }
  async cancelSpecialDuty(id: string, reason: string) { return this.fetch(`/special-duty/${id}/cancel`, { method: 'PATCH', body: JSON.stringify({ reason }) }); }

  // === PAYROLL ===
  async getPayrollRecords(month?: number, year?: number, status?: string) {
    const params: Record<string, string> = {};
    if (month) params.month = String(month);
    if (year) params.year = String(year);
    if (status) params.status = status;
    return this.fetch(`/payroll?${new URLSearchParams(params)}`);
  }
  async getGuardPayroll(guardId: string) { return this.fetch(`/payroll/guard/${guardId}`); }
  async getCurrentMonthPayroll(guardId: string) { return this.fetch(`/payroll/guard/${guardId}/current`); }
  async generatePayrollRun(data: { month: number; year: number }) { return this.fetch('/payroll/generate', { method: 'POST', body: JSON.stringify(data) }); }
  async approvePayroll(id: string) { return this.fetch(`/payroll/${id}/approve`, { method: 'PATCH' }); }
  async getPayrollReport(month: number, year: number) { return this.fetch(`/payroll/reports/monthly?month=${month}&year=${year}`); }

  // === SPOT CHECK ===
  async getActiveGuardsForSpotCheck(siteId: string) { return this.fetch(`/spot-check/active-guards?siteId=${siteId}`); }
  async getSpotChecks(siteId?: string, guardId?: string) {
    const params: Record<string, string> = {};
    if (siteId) params.siteId = siteId;
    if (guardId) params.guardId = guardId;
    return this.fetch(`/spot-check?${new URLSearchParams(params)}`);
  }
  async recordSpotCheck(data: any) { return this.fetch('/spot-check', { method: 'POST', body: JSON.stringify(data) }); }
  async raiseCharge(data: any) { return this.fetch('/spot-check/charges', { method: 'POST', body: JSON.stringify(data) }); }
  async getAllCharges(guardId?: string, status?: string) {
    const params: Record<string, string> = {};
    if (guardId) params.guardId = guardId;
    if (status) params.status = status;
    return this.fetch(`/spot-check/charges?${new URLSearchParams(params)}`);
  }
  async updateChargeStatus(id: string, status: string, statusNotes: string) { return this.fetch(`/spot-check/charges/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, statusNotes }) }); }
  async initiateDeploymentVoid(data: any) { return this.fetch('/spot-check/void', { method: 'POST', body: JSON.stringify(data) }); }
  async approveDeploymentVoid(id: string, approved: boolean, decisionNote?: string) { return this.fetch(`/spot-check/void/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ approved, decisionNote }) }); }

  // === FOOD SUPPLIER ===
  async getFoodSupplierHeadcount(siteId: string) { return this.fetch(`/food-supplier/headcount?siteId=${siteId}`); }
  async verifyMeal(data: any) { return this.fetch('/food-supplier/verify', { method: 'POST', body: JSON.stringify(data) }); }
  async endMealSession(sessionId: string) { return this.fetch(`/food-supplier/session/${sessionId}/end`, { method: 'PATCH' }); }
  async getFoodDeliveries() { return this.fetch('/food-supplier/deliveries'); }

  // === DASHBOARD ===
  async getDashboardStats() { return this.fetch('/dashboard/stats'); }
  async getGuardDashboard() { return this.fetch('/dashboard/guard'); }
  async getSupervisorDashboard() { return this.fetch('/dashboard/supervisor'); }
  async getClientDashboard() { return this.fetch('/dashboard/client'); }

  // === ANALYTICS ===
  async getAttendanceTrend(days = 30) { return this.fetch(`/analytics/attendance-trend?days=${days}`); }
  async getIncidentTrend(days = 30) { return this.fetch(`/analytics/incident-trend?days=${days}`); }
  async getGuardPerformance() { return this.fetch('/analytics/guard-performance'); }
  async getSiteSummary() { return this.fetch('/analytics/site-summary'); }
  async exportData(type: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams({ type });
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    return this.fetch(`/analytics/export?${params.toString()}`);
  }

  // === NOTIFICATIONS ===
  async getNotifications() { return this.fetch('/notifications'); }
  async getUnreadCount() { return this.fetch('/notifications/unread-count'); }
  async markNotificationRead(id: string) { return this.fetch(`/notifications/${id}/read`, { method: 'PATCH' }); }
  async markAllNotificationsRead() { return this.fetch('/notifications/read-all', { method: 'PATCH' }); }

  // === CHAT ===
  getChatConversations = async () => { return this.fetch('/chat/conversations'); }
  createChatConversation = async (data: any) => { return this.fetch('/chat/conversations', { method: 'POST', body: JSON.stringify(data) }); }
  getChatConversation = async (id: string) => { return this.fetch(`/chat/conversations/${id}`); }
  getChatMessages = async (conversationId: string, cursor?: string, limit = 50) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set('cursor', cursor);
    return this.fetch(`/chat/conversations/${conversationId}/messages?${params}`);
  }
  sendChatMessage = async (conversationId: string, data: any) => {
    return this.fetch(`/chat/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify(data) });
  }
  markChatRead = async (conversationId: string) => { return this.fetch(`/chat/conversations/${conversationId}/read`, { method: 'PATCH' }); }
  getChatUnreadCount = async () => { return this.fetch('/chat/unread-count'); }
  getChatContacts = async () => { return this.fetch('/chat/contacts'); }
  getContextualChat = async (type: string, id: string) => { return this.fetch(`/chat/context/${type}/${id}`); }
  sendBroadcast = async (data: any) => { return this.fetch('/chat/broadcast', { method: 'POST', body: JSON.stringify(data) }); }

  // === REPORTS (JRS BRAP) ===
  async generateDailyReport(data?: { date?: string; siteId?: string; regionId?: string }) { return this.fetch('/reports/generate-daily', { method: 'POST', body: JSON.stringify(data || {}) }); }
  async generateNightShiftReport(data?: { date?: string }) { return this.fetch('/reports/generate-night-shift', { method: 'POST', body: JSON.stringify(data || {}) }); }
  async getReportCoverage(date?: string, siteId?: string) {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (siteId) params.set('siteId', siteId);
    return this.fetch(`/reports/coverage?${params}`);
  }
  async getCallCard(date?: string) { return this.fetch(`/reports/call-card${date ? `?date=${date}` : ''}`); }
  async getAbsentGuards(date?: string) { return this.fetch(`/reports/absent-guards${date ? `?date=${date}` : ''}`); }
  async sendReport(reportId: string, recipientIds: string[]) { return this.fetch(`/reports/${reportId}/send`, { method: 'POST', body: JSON.stringify({ recipientIds }) }); }
  async getReports(type?: string) { return this.fetch(`/reports${type ? `?type=${type}` : ''}`); }
  async getReportById(id: string) { return this.fetch(`/reports/${id}`); }

  // === CHARGE SHEETS (URSB BRAP) ===
  async createChangeSheet(data: any) { return this.fetch('/change-sheets', { method: 'POST', body: JSON.stringify(data) }); }
  async getChangeSheets(guardId?: string, status?: string, changeType?: string) {
    const params = new URLSearchParams();
    if (guardId) params.set('guardId', guardId);
    if (status) params.set('status', status);
    if (changeType) params.set('changeType', changeType);
    return this.fetch(`/change-sheets?${params}`);
  }
  async getChangeSheet(id: string) { return this.fetch(`/change-sheets/${id}`); }
  async approveChangeSheet(id: string, approved: boolean) { return this.fetch(`/change-sheets/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ approved }) }); }

  // === PERSONNEL MOVEMENTS (URSB BRAP) ===
  async createPersonnelMovement(data: any) { return this.fetch('/personnel-movements', { method: 'POST', body: JSON.stringify(data) }); }
  async getPersonnelMovements(guardId?: string, status?: string, type?: string) {
    const params = new URLSearchParams();
    if (guardId) params.set('guardId', guardId);
    if (status) params.set('status', status);
    if (type) params.set('type', type);
    return this.fetch(`/personnel-movements?${params}`);
  }
  async approvePersonnelMovement(id: string, approved: boolean) { return this.fetch(`/personnel-movements/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ approved }) }); }
  async completePersonnelMovement(id: string) { return this.fetch(`/personnel-movements/${id}/complete`, { method: 'PATCH' }); }
}

export const api = new ApiClient();
