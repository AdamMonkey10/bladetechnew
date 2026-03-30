// REST API implementation of WarehouseRepo
import type { WarehouseRepo } from '../repo/WarehouseRepo';
import type { WarehouseLayout, Product, SlotCode, StockMovement, SlotInventory, WarehouseKPIs } from '../types';

export class RestWarehouseRepo implements WarehouseRepo {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.headers = {
      'Content-Type': 'application/json',
      ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
    };
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: { ...this.headers, ...options?.headers }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getLayout(): Promise<WarehouseLayout> {
    return this.request<WarehouseLayout>('/warehouse/layout');
  }

  async saveLayout(layout: WarehouseLayout): Promise<void> {
    await this.request('/warehouse/layout', {
      method: 'PUT',
      body: JSON.stringify(layout)
    });
  }

  async listProducts(q?: string): Promise<Product[]> {
    const params = q ? `?q=${encodeURIComponent(q)}` : '';
    return this.request<Product[]>(`/warehouse/products${params}`);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    try {
      return await this.request<Product>(`/warehouse/products/${id}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return undefined;
      }
      throw error;
    }
  }

  async upsertProduct(p: Product): Promise<void> {
    await this.request(`/warehouse/products/${p.id}`, {
      method: 'PUT',
      body: JSON.stringify(p)
    });
  }

  async deleteProduct(id: string): Promise<void> {
    await this.request(`/warehouse/products/${id}`, {
      method: 'DELETE'
    });
  }

  async moveStock(opts: StockMovement): Promise<void> {
    await this.request('/warehouse/stock/move', {
      method: 'POST',
      body: JSON.stringify(opts)
    });
  }

  async getSlotInventory(code: SlotCode): Promise<SlotInventory> {
    return this.request<SlotInventory>(`/warehouse/slots/${encodeURIComponent(code)}/inventory`);
  }

  async updateSlotInventory(code: SlotCode, productId: string, quantity: number): Promise<void> {
    await this.request(`/warehouse/slots/${encodeURIComponent(code)}/inventory`, {
      method: 'PUT',
      body: JSON.stringify({ productId, quantity })
    });
  }

  async getKPIs(): Promise<WarehouseKPIs> {
    return this.request<WarehouseKPIs>('/warehouse/kpis');
  }

  async getStockHistory(days = 30): Promise<Array<{ date: string; totalStock: number }>> {
    return this.request<Array<{ date: string; totalStock: number }>>(`/warehouse/stock/history?days=${days}`);
  }

  subscribeLayout(cb: (layout: WarehouseLayout) => void): () => void {
    // Polling-based subscription for REST
    const interval = setInterval(async () => {
      try {
        const layout = await this.getLayout();
        cb(layout);
      } catch (error) {
        console.error('Failed to fetch layout:', error);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }

  subscribeKPIs(cb: (kpis: WarehouseKPIs) => void): () => void {
    // Polling-based subscription for REST
    const interval = setInterval(async () => {
      try {
        const kpis = await this.getKPIs();
        cb(kpis);
      } catch (error) {
        console.error('Failed to fetch KPIs:', error);
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }
}