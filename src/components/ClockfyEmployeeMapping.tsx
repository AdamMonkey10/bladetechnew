import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Link, UserCheck, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClockfyEmployee {
  id: string;
  clockfy_employee_id: string;
  name: string;
  email: string | null;
  is_active: boolean;
  mapped_operator_id: string | null;
}

interface Operator {
  id: string;
  operator_name: string;
  operator_code: string;
  active: boolean;
}

export function ClockfyEmployeeMapping() {
  const [employees, setEmployees] = useState<ClockfyEmployee[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Using any type temporarily until TypeScript types are regenerated
      const [employeesResponse, operatorsResponse] = await Promise.all([
        (supabase as any).from('clockfy_employees').select('*').order('name'),
        supabase.from('operators').select('*').eq('active', true).order('operator_name')
      ]);

      if (employeesResponse.error) throw employeesResponse.error;
      if (operatorsResponse.error) throw operatorsResponse.error;

      setEmployees(employeesResponse.data || []);
      setOperators(operatorsResponse.data || []);
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapping = async (employeeId: string, operatorId: string | null) => {
    try {
      // Convert "none" to null for database storage
      const mappedOperatorId = operatorId === "none" ? null : operatorId;
      
      const { error } = await (supabase as any)
        .from('clockfy_employees')
        .update({ mapped_operator_id: mappedOperatorId })
        .eq('id', employeeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Employee mapping updated successfully",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error updating mapping",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const mappedCount = employees.filter(emp => emp.mapped_operator_id).length;
  const unmappedCount = employees.length - mappedCount;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">From Clockfy system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mapped</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{mappedCount}</div>
            <p className="text-xs text-muted-foreground">Linked to operators</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unmapped</CardTitle>
            <Link className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{unmappedCount}</div>
            <p className="text-xs text-muted-foreground">Need mapping</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee to Operator Mapping</CardTitle>
          <p className="text-sm text-muted-foreground">
            Map Clockfy employees to Production operators to enable analytics integration
          </p>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No Clockfy employees found. They will appear here once webhook data starts flowing.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mapped Operator</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => {
                  const mappedOperator = operators.find(op => op.id === employee.mapped_operator_id);
                  
                  return (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.email || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={employee.is_active ? "default" : "secondary"}>
                          {employee.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {mappedOperator ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {mappedOperator.operator_name} ({mappedOperator.operator_code})
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            Unmapped
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={employee.mapped_operator_id || "none"}
                          onValueChange={(value) => handleMapping(employee.id, value || null)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select operator..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No mapping</SelectItem>
                            {operators.map((operator) => (
                              <SelectItem key={operator.id} value={operator.id}>
                                {operator.operator_name} ({operator.operator_code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}