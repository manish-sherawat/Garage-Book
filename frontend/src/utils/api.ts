let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://garagebook-new.vercel.app/api/v1' : 'http://localhost:5000/api/v1');
if (API_BASE_URL && !API_BASE_URL.endsWith('/api/v1')) {
  API_BASE_URL = `${API_BASE_URL.replace(/\/$/, '')}/api/v1`;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function safeFetch<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('garagebook_token') : null;
    const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(options?.headers as Record<string, string>),
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorMsg = `API request failed: ${res.status}`;
      try {
        const errorData = await res.json();
        errorMsg = errorData.message || errorData.error || errorMsg;
      } catch (e) {
        // Ignored
      }

      if (res.status === 401 && typeof window !== 'undefined') {
        const existingToken = localStorage.getItem('garagebook_token');
        if (existingToken) {
          localStorage.removeItem('garagebook_token');
          window.location.reload();
        }
      }

      throw new ApiError(errorMsg, res.status);
    }
    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// ─── Financial & Accounting APIs ─────────────────────────────────────────────
export async function getInvoices() {
  return safeFetch<any[]>('/billing/invoices');
}

export async function createInvoice(data: any) {
  return safeFetch<any>('/billing/invoices', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateInvoiceStatus(id: string, status: string) {
  return safeFetch<any>(`/billing/invoices/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function getFinancialSummary(timeRange?: string) {
  const query = timeRange ? `?timeRange=${timeRange}` : '';
  return safeFetch<{
    totalRevenue: number;
    totalProcurementExpense: number;
    totalLabourCost: number;
    netProfit: number;
    taxSummary: {
      totalGstCollected: number;
      cgst: number;
      sgst: number;
      igst: number;
      taxableRevenue: number;
    };
    paymentBreakdown: {
      upi: number;
      card: number;
      cash: number;
      netbanking: number;
    };
  }>(`/accounting/summary${query}`);
}

export async function getPayments(timeRange?: string) {
  const query = timeRange ? `?timeRange=${timeRange}` : '';
  return safeFetch<any[]>(`/payments${query}`);
}

export async function createPayment(data: { jobCardId: string; amount: number; paymentMethod: string; transactionId?: string; notes?: string }) {
  return safeFetch<any>('/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Job Cards APIs ──────────────────────────────────────────────────────────
export async function getJobCards() {
  return safeFetch<any[]>('/job-cards');
}

export async function createJobCard(data: any) {
  return safeFetch<any>('/job-cards', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateJobCardStatus(id: string, status: string) {
  return safeFetch<any>(`/job-cards/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}


// ─── Workshop Bays APIs ──────────────────────────────────────────────────────
export async function getWorkshopBays() {
  return safeFetch<any[]>('/workshop-bays');
}

export async function allocateWorkshopBay(data: { bayId: string; jobCardId: string; mechanicId?: string }) {
  return safeFetch<any>('/workshop-bays/allocate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function releaseWorkshopBay(bayId: string) {
  return safeFetch<any>(`/workshop-bays/${bayId}/release`, {
    method: 'POST',
  });
}

export async function updateWorkshopBayStatus(bayId: string, status: string) {
  return safeFetch<any>(`/workshop-bays/${bayId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function createWorkshopBay(data: any) {
  return safeFetch<any>('/workshop-bays', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Vehicles APIs ────────────────────────────────────────────────────────────
export async function getVehicles() {
  return safeFetch<any[]>('/vehicles');
}

export async function createVehicle(data: any) {
  return safeFetch<any>('/vehicles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Procurement & Purchase Orders APIs ──────────────────────────────────────
export async function getPurchaseOrders() {
  return safeFetch<any[]>('/procurement/purchase-orders');
}

export async function createPurchaseOrder(data: any) {
  return safeFetch<any>('/procurement/purchase-orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function receivePurchaseOrder(poId: string) {
  return safeFetch<any>(`/procurement/purchase-orders/${poId}/receive`, {
    method: 'PATCH',
  });
}

export async function cancelPurchaseOrder(poId: string) {
  return safeFetch<any>(`/procurement/purchase-orders/${poId}/cancel`, {
    method: 'PATCH',
  });
}

export async function getSuppliers() {
  return safeFetch<any[]>('/procurement/suppliers');
}

export async function createSupplier(data: any) {
  return safeFetch<any>('/procurement/suppliers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Inventory APIs ────────────────────────────────────────────────────────────
export async function getInventoryItems() {
  return safeFetch<any[]>('/procurement/inventory');
}

export async function createInventoryItem(data: any) {
  return safeFetch<any>('/procurement/inventory', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function bulkCreateInventoryItems(data: any) {
  return safeFetch<any>('/procurement/inventory/bulk', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateInventoryItem(id: string, data: any) {
  return safeFetch<any>(`/procurement/inventory/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteInventoryItem(id: string) {
  return safeFetch<any>(`/procurement/inventory/${id}`, {
    method: 'DELETE',
  });
}

// ─── Dashboard Metrics API ───────────────────────────────────────────────────
export async function getDashboardMetrics() {
  return safeFetch<{
    jobs: number;
    freeBays: number;
    vehicles: number;
    activeMechanics: number;
  }>('/dashboard/badge-counts');
}

export async function getDashboardStats() {
  return safeFetch<any>('/dashboard/stats');
}

// ─── Customers APIs ─────────────────────────────────────────────────────────
export async function getCustomers() {
  return safeFetch<any[]>('/customers');
}

export async function createCustomer(data: any) {
  return safeFetch<any>('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCustomer(id: string, data: any) {
  return safeFetch<any>(`/customers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteCustomer(id: string) {
  return safeFetch<any>(`/customers/${id}`, {
    method: 'DELETE',
  });
}

// ─── Mechanics & Technicians APIs ───────────────────────────────────────────
export async function getMechanics() {
  return safeFetch<any[]>('/mechanics');
}

export async function createMechanic(data: any) {
  return safeFetch<any>('/mechanics', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateMechanic(id: string, data: any) {
  return safeFetch<any>(`/mechanics/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function saveMechanicAttendance(date: string, attendanceData: Record<string, string>) {
  return safeFetch<any>('/mechanics/attendance', {
    method: 'PUT',
    body: JSON.stringify({ date, attendanceData }),
  });
}

export async function deleteMechanic(id: string) {
  return safeFetch<any>(`/mechanics/${id}`, {
    method: 'DELETE',
  });
}

// ─── Settings APIs ─────────────────────────────────────────────
export async function getSettings() {
  return safeFetch<Record<string, any>>('/settings');
}

export async function updateSettings(data: Record<string, any>) {
  return safeFetch<{ success: boolean; message: string }>('/settings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export const fetchBadgeCounts = getDashboardMetrics;

export async function getAnalytics(timeRange?: string) {
  const query = timeRange ? `?timeRange=${timeRange}` : '';
  return safeFetch<{
    fullRevenueData: { month: string; revenue: number }[];
    yoyGrowth: string;
    baseMechanics: { name: string; role: string; jobsCompleted: number; revenueGenerated: number; avgTime: string; rating: number }[];
    baseParts: { name: string; category: string; count: number; unit: string }[];
  }>(`/dashboard/analytics${query}`);
}
