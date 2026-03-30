// Warehouse dashboard with KPIs
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingUp, TrendingDown, AlertTriangle, Map, Settings, Package2, Building2 } from 'lucide-react';
import { useWarehouseRepo } from '../hooks/useWarehouseRepo';
import { useWarehouseStore } from '../store';

const Dashboard = () => {
  const repo = useWarehouseRepo();
  const { permissions } = useWarehouseStore();

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['warehouse', 'kpis'],
    queryFn: () => repo.getKPIs(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const kpiCards = [
    {
      title: 'Total SKUs',
      value: kpis?.totalSKUs || 0,
      icon: Package,
      color: 'text-blue-600',
    },
    {
      title: 'Units In Today',
      value: kpis?.unitsInToday || 0,
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      title: 'Units Out Today',
      value: kpis?.unitsOutToday || 0,
      icon: TrendingDown,
      color: 'text-orange-600',
    },
    {
      title: 'Capacity Used',
      value: `${kpis?.capacityUsedPercent || 0}%`,
      icon: Package2,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Warehouse Dashboard</h1>
          <p className="text-muted-foreground">Monitor inventory and warehouse operations</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="goods-movement">
              <Package className="w-4 h-4 mr-2" />
              Goods In/Out
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="builder">
              <Building2 className="w-4 h-4 mr-2" />
              Warehouse Builder
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="shelf-map">
              <Map className="w-4 h-4 mr-2" />
              Shelf Map
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="inventory">
              <Package className="w-4 h-4 mr-2" />
              Inventory
            </Link>
          </Button>
          {permissions.canEdit && (
            <Button asChild variant="outline">
              <Link to="editor">
                <Settings className="w-4 h-4 mr-2" />
                Layout Editor
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className="card-touch">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {kpi.title}
                  </p>
                  <p className="text-2xl font-bold">
                    {kpisLoading ? '...' : kpi.value}
                  </p>
                </div>
                <div className={`p-2 rounded-lg bg-muted ${kpi.color}`}>
                  <kpi.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      {kpis && kpis.replenishmentAlerts > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  Replenishment Required
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  {kpis.replenishmentAlerts} items are below minimum stock levels
                </p>
              </div>
              <Badge variant="outline" className="ml-auto text-orange-600 border-orange-300">
                {kpis.replenishmentAlerts} alerts
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-touch cursor-pointer hover:shadow-elevated transition-shadow">
          <Link to="goods-movement" className="block p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900">
                <Package className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold">Goods In/Out</h3>
                <p className="text-sm text-muted-foreground">
                  Track incoming and outgoing inventory
                </p>
              </div>
            </div>
          </Link>
        </Card>

        <Card className="card-touch cursor-pointer hover:shadow-elevated transition-shadow">
          <Link to="builder" className="block p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">Warehouse Builder</h3>
                <p className="text-sm text-muted-foreground">
                  Create layouts with an easy builder
                </p>
              </div>
            </div>
          </Link>
        </Card>
        
        <Card className="card-touch cursor-pointer hover:shadow-elevated transition-shadow">
          <Link to="shelf-map" className="block p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Map className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Interactive Shelf Map</h3>
                <p className="text-sm text-muted-foreground">
                  Visualize warehouse layout and stock levels
                </p>
              </div>
            </div>
          </Link>
        </Card>

        <Card className="card-touch cursor-pointer hover:shadow-elevated transition-shadow">
          <Link to="inventory" className="block p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Inventory Management</h3>
                <p className="text-sm text-muted-foreground">
                  Manage products and stock transfers
                </p>
              </div>
            </div>
          </Link>
        </Card>

        {permissions.canEdit && (
          <Card className="card-touch cursor-pointer hover:shadow-elevated transition-shadow">
            <Link to="editor" className="block p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900">
                  <Settings className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Advanced Editor</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure with JSON editor
                  </p>
                </div>
              </div>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;