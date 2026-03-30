// Supabase implementation of WarehouseRepo
import { supabase } from '@/integrations/supabase/client';
import type { WarehouseRepo } from '../repo/WarehouseRepo';
import type { WarehouseLayout, Product, SlotCode, StockMovement, SlotInventory, WarehouseKPIs } from '../types';

export class SupabaseWarehouseRepo implements WarehouseRepo {
  async getLayout(): Promise<WarehouseLayout> {
    const { data, error } = await supabase
      .from('warehouse_layouts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching warehouse layout:', error);
      return this.getDefaultLayout();
    }

    if (!data) {
      return this.getDefaultLayout();
    }

    // The config contains the aisles
    const layoutData = (data.config as any as { aisles: any[] }) || { aisles: [] };

    return {
      id: data.id,
      name: data.name,
      updatedAt: data.updated_at,
      aisles: layoutData.aisles || []
    };
  }

  private getDefaultLayout(): WarehouseLayout {
    return {
      id: 'default-warehouse',
      name: 'Default Warehouse',
      updatedAt: new Date().toISOString(),
      aisles: []
    };
  }

  async saveLayout(layout: WarehouseLayout): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to save layout');
    }

    // Check if layout exists
    const { data: existing } = await supabase
      .from('warehouse_layouts')
      .select('id')
      .eq('id', layout.id)
      .maybeSingle();

    if (existing) {
      // Update existing layout
      const { error } = await supabase
        .from('warehouse_layouts')
        .update({
          layout_data: { aisles: layout.aisles },
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', layout.id);

      if (error) {
        console.error('Error updating warehouse layout:', error);
        throw new Error('Failed to update warehouse layout');
      }
    } else {
      // Insert new layout
      const { error } = await supabase
        .from('warehouse_layouts')
        .insert({
          name: layout.name,
          layout_data: { aisles: layout.aisles },
          created_by: user.id
        } as any);

      if (error) {
        console.error('Error creating warehouse layout:', error);
        throw new Error('Failed to create warehouse layout');
      }
    }
  }

  async listProducts(q?: string): Promise<Product[]> {
    let query = supabase
      .from('warehouse_products')
      .select('*')
      .order('name');

    if (q) {
      query = query.or(`sku.ilike.%${q}%,name.ilike.%${q}%,barcode.ilike.%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return (data || []).map(this.mapDatabaseProductToProduct);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const { data, error } = await supabase
      .from('warehouse_products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching product:', error);
      return undefined;
    }

    return data ? this.mapDatabaseProductToProduct(data) : undefined;
  }

  async upsertProduct(p: Product): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to manage products');
    }

    const { error } = await supabase
      .from('warehouse_products')
      .upsert({
        id: p.id,
        sku: p.sku,
        name: p.name,
        barcode: p.barcode,
        dimensions_mm: p.dimsMm,
        weight_kg: p.weightKg,
        min_qty: p.minQty || 0,
        max_qty: p.maxQty,
        expiry_date: p.expiryDate,
        attributes: p.attributes || {},
        created_by: user.id,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error upserting product:', error);
      throw new Error('Failed to save product');
    }
  }

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('warehouse_products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      throw new Error('Failed to delete product');
    }
  }

  async moveStock(opts: StockMovement): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to move stock');
    }

    const movementType = opts.from && opts.to ? 'transfer' : opts.from ? 'out' : 'in';

    const { error: movementError } = await supabase
      .from('warehouse_stock_movements')
      .insert({
        movement_type: movementType,
        product_id: opts.productId,
        from_slot_code: opts.from,
        to_slot_code: opts.to,
        quantity: opts.qty,
        weight_kg: opts.weightKg,
        performed_by: user.id
      });

    if (movementError) {
      console.error('Error recording stock movement:', movementError);
      throw new Error('Failed to record stock movement');
    }
  }

  async getSlotInventory(code: SlotCode): Promise<SlotInventory> {
    const { data, error } = await supabase
      .from('warehouse_slot_inventory')
      .select(`
        *,
        warehouse_products (*)
      `)
      .eq('slot_code', code)
      .maybeSingle();

    if (error) {
      console.error('Error fetching slot inventory:', error);
      return { qty: 0 };
    }

    if (!data) {
      return { qty: 0 };
    }

    return {
      product: data.warehouse_products ? this.mapDatabaseProductToProduct(data.warehouse_products) : undefined,
      qty: data.quantity,
      totalWeightKg: data.warehouse_products?.weight_kg ? data.quantity * data.warehouse_products.weight_kg : undefined
    };
  }

  async updateSlotInventory(code: SlotCode, productId: string, quantity: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to update inventory');
    }

    if (quantity <= 0) {
      // Remove inventory record if quantity is 0 or negative
      const { error } = await supabase
        .from('warehouse_slot_inventory')
        .delete()
        .eq('slot_code', code)
        .eq('product_id', productId);

      if (error) {
        console.error('Error removing slot inventory:', error);
        throw new Error('Failed to update slot inventory');
      }
    } else {
      // Upsert inventory record
      const { error } = await supabase
        .from('warehouse_slot_inventory')
        .upsert({
          slot_code: code,
          product_id: productId,
          quantity: quantity,
          last_updated_by: user.id,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating slot inventory:', error);
        throw new Error('Failed to update slot inventory');
      }
    }
  }

  async getKPIs(): Promise<WarehouseKPIs> {
    // Get total SKUs
    const { count: totalSKUs } = await supabase
      .from('warehouse_products')
      .select('*', { count: 'exact', head: true });

    // Get today's movements
    const today = new Date().toISOString().split('T')[0];
    const { data: todayMovements } = await supabase
      .from('warehouse_stock_movements')
      .select('quantity, movement_type')
      .gte('created_at', `${today}T00:00:00Z`)
      .lt('created_at', `${today}T23:59:59Z`);

    const unitsInToday = todayMovements
      ?.filter(m => m.movement_type === 'in')
      .reduce((sum, m) => sum + m.quantity, 0) || 0;

    const unitsOutToday = todayMovements
      ?.filter(m => m.movement_type === 'out')
      .reduce((sum, m) => sum + m.quantity, 0) || 0;

    // Calculate capacity usage
    const { data: inventoryData } = await supabase
      .from('warehouse_slot_inventory')
      .select('quantity');

    const totalUnits = inventoryData?.reduce((sum, inv) => sum + inv.quantity, 0) || 0;
    const estimatedCapacity = 10000; // This would come from layout configuration
    const capacityUsedPercent = Math.min(100, Math.round((totalUnits / estimatedCapacity) * 100));

    // Get replenishment alerts (products below minimum quantity)
    const { data: productsNeedingReplenishment } = await supabase
      .from('warehouse_products')
      .select(`
        id,
        min_stock,
        warehouse_slot_inventory!inner(quantity)
      `)
      .gt('min_stock', 0);

    let replenishmentAlerts = 0;
    if (productsNeedingReplenishment) {
      replenishmentAlerts = (productsNeedingReplenishment as any[]).filter((product: any) => {
        const totalQty = product.warehouse_slot_inventory?.reduce((sum: number, inv: any) => sum + inv.quantity, 0) || 0;
        return totalQty < (product.min_stock || 0);
      }).length;
    }

    return {
      totalSKUs: totalSKUs || 0,
      unitsInToday,
      unitsOutToday,
      capacityUsedPercent,
      replenishmentAlerts
    };
  }

  async getStockHistory(days = 30): Promise<Array<{ date: string; totalStock: number }>> {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const { data: movements } = await supabase
      .from('warehouse_stock_movements')
      .select('created_at, quantity, movement_type')
      .gte('created_at', startDateStr)
      .lte('created_at', endDate)
      .order('created_at');

    // Aggregate daily totals
    const dailyTotals = new Map<string, number>();
    let runningTotal = 0;

    movements?.forEach(movement => {
      const date = movement.created_at.split('T')[0];
      const change = movement.movement_type === 'in' ? movement.quantity : 
                     movement.movement_type === 'out' ? -movement.quantity : 0;
      
      if (!dailyTotals.has(date)) {
        dailyTotals.set(date, runningTotal);
      }
      runningTotal += change;
      dailyTotals.set(date, runningTotal);
    });

    // Convert to array format
    const history = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      history.push({
        date: dateStr,
        totalStock: Math.max(0, dailyTotals.get(dateStr) || 0)
      });
    }

    return history;
  }

  subscribeLayout(cb: (layout: WarehouseLayout) => void): () => void {
    const channel = supabase
      .channel('warehouse-layout-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'warehouse_layouts'
        },
        async () => {
          const layout = await this.getLayout();
          cb(layout);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  subscribeKPIs(cb: (kpis: WarehouseKPIs) => void): () => void {
    // Subscribe to changes that affect KPIs
    const channel = supabase
      .channel('warehouse-kpi-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'warehouse_stock_movements'
        },
        async () => {
          const kpis = await this.getKPIs();
          cb(kpis);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  private mapDatabaseProductToProduct(dbProduct: any): Product {
    return {
      id: dbProduct.id,
      sku: dbProduct.sku,
      name: dbProduct.name,
      barcode: dbProduct.barcode,
      dimsMm: dbProduct.dimensions_mm,
      weightKg: dbProduct.weight_kg,
      minQty: dbProduct.min_qty,
      maxQty: dbProduct.max_qty,
      expiryDate: dbProduct.expiry_date,
      attributes: dbProduct.attributes || {}
    };
  }
}