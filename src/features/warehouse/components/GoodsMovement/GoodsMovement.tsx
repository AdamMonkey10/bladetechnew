// Comprehensive goods in/out management component
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Package, 
  Search, 
  Filter,
  Plus,
  TrendingUp,
  TrendingDown,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import GoodsInForm from './GoodsInForm';
import GoodsOutForm from './GoodsOutForm';
import GoodsMovementTable from './GoodsMovementTable';
import StockLevelsCard from './StockLevelsCard';

interface WarehouseMovement {
  id: string;
  movement_type: 'IN' | 'OUT' | 'TRANSFER';
  product_id: string;
  from_slot_code?: string;
  to_slot_code?: string;
  quantity: number;
  created_at: string;
  notes?: string;
  performed_by: string; // Changed from user_id to match actual database schema
}

interface WarehouseStockLevel {
  slot_code: string;
  product_id?: string;
  product_sku?: string;
  product_name?: string;
  quantity: number;
  location: string;
}

const GoodsMovement = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'in' | 'out' | 'movements'>('overview');
  const [showInForm, setShowInForm] = useState(false);
  const [showOutForm, setShowOutForm] = useState(false);

  // Fetch warehouse stock movements
  const { data: movements, isLoading: movementsLoading, refetch: refetchMovements } = useQuery({
    queryKey: ['warehouse-movements', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('warehouse_stock_movements')
        .select(`
          *,
          warehouse_products!inner(sku, name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (searchQuery) {
        query = query.or(`notes.ilike.%${searchQuery}%,from_slot_code.ilike.%${searchQuery}%,to_slot_code.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as WarehouseMovement[];
    },
  });

  // Fetch warehouse inventory levels
  const { data: stockLevels, isLoading: stockLoading, refetch: refetchStock } = useQuery({
    queryKey: ['warehouse-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouse_slot_inventory')
        .select(`
          slot_code,
          quantity,
          product_id,
          warehouse_products!inner (
            sku,
            name
          )
        `)
        .gt('quantity', 0);
      
      if (error) throw error;
      
      return data.map((item: any) => ({
        slot_code: item.slot_code,
        product_id: item.product_id,
        product_sku: item.warehouse_products?.sku,
        product_name: item.warehouse_products?.name,
        quantity: item.quantity,
        location: item.slot_code // Use slot code as location for now
      })) as WarehouseStockLevel[];
    },
  });

  // Calculate summary metrics
  const summaryMetrics = React.useMemo(() => {
    if (!movements) return null;

    const today = new Date().toISOString().split('T')[0];
    const todayMovements = movements.filter(m => m.created_at.startsWith(today));
    
    const inToday = todayMovements
      .filter(m => m.movement_type === 'IN')
      .reduce((sum, m) => sum + m.quantity, 0);
      
    const outToday = todayMovements
      .filter(m => m.movement_type === 'OUT')
      .reduce((sum, m) => sum + m.quantity, 0);

    const lowStockItems = stockLevels?.filter(s => s.quantity < 10).length || 0;
    const totalItems = stockLevels?.length || 0;

    return {
      inToday,
      outToday,
      netMovement: inToday - outToday,
      lowStockItems,
      totalItems,
    };
  }, [movements, stockLevels]);

  const handleFormSuccess = () => {
    setShowInForm(false);
    setShowOutForm(false);
    refetchMovements();
    refetchStock();
    toast({
      title: "Success",
      description: "Movement recorded successfully",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Goods Management</h1>
          <p className="text-muted-foreground">Track incoming and outgoing inventory movements</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search movements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          
          {/* Action Buttons */}
          <Button onClick={() => setShowInForm(true)} className="flex items-center gap-2">
            <ArrowDownCircle className="w-4 h-4" />
            Goods In
          </Button>
          <Button onClick={() => setShowOutForm(true)} variant="outline" className="flex items-center gap-2">
            <ArrowUpCircle className="w-4 h-4" />
            Goods Out
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summaryMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-touch">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Today</p>
                  <p className="text-2xl font-bold text-green-600">{summaryMetrics.inToday}</p>
                </div>
                <ArrowDownCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-touch">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Out Today</p>
                  <p className="text-2xl font-bold text-orange-600">{summaryMetrics.outToday}</p>
                </div>
                <ArrowUpCircle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-touch">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Net Movement</p>
                  <p className={`text-2xl font-bold ${summaryMetrics.netMovement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {summaryMetrics.netMovement >= 0 ? '+' : ''}{summaryMetrics.netMovement}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-touch">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
                  <p className="text-2xl font-bold text-red-600">{summaryMetrics.lowStockItems}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-fit grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="in" className="flex items-center gap-2">
            <ArrowDownCircle className="w-4 h-4" />
            Goods In
          </TabsTrigger>
          <TabsTrigger value="out" className="flex items-center gap-2">
            <ArrowUpCircle className="w-4 h-4" />
            Goods Out
          </TabsTrigger>
          <TabsTrigger value="movements" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            All Movements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <StockLevelsCard 
              stockLevels={stockLevels} 
              loading={stockLoading} 
            />
            <Card>
              <CardHeader>
                <CardTitle>Recent Movements</CardTitle>
              </CardHeader>
              <CardContent>
                <GoodsMovementTable 
                  movements={movements?.slice(0, 10) || []} 
                  loading={movementsLoading}
                  compact={true}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="in" className="mt-6">
          <GoodsMovementTable 
            movements={movements?.filter(m => m.movement_type === 'IN') || []} 
            loading={movementsLoading}
            title="Goods Received"
            emptyMessage="No goods received yet"
          />
        </TabsContent>

        <TabsContent value="out" className="mt-6">
          <GoodsMovementTable 
            movements={movements?.filter(m => m.movement_type === 'OUT') || []} 
            loading={movementsLoading}
            title="Goods Dispatched"
            emptyMessage="No goods dispatched yet"
          />
        </TabsContent>

        <TabsContent value="movements" className="mt-6">
          <GoodsMovementTable 
            movements={movements || []} 
            loading={movementsLoading}
            title="All Movements"
            showMovementType={true}
          />
        </TabsContent>
      </Tabs>

      {/* Forms */}
      <GoodsInForm 
        open={showInForm}
        onOpenChange={setShowInForm}
        onSuccess={handleFormSuccess}
      />
      
      <GoodsOutForm 
        open={showOutForm}
        onOpenChange={setShowOutForm}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default GoodsMovement;