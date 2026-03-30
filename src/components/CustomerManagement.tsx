import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCustomers, Customer } from '@/hooks/useCustomers';
import { LogoPositioner } from './LogoPositioner';
import { Upload, ExternalLink, Plus, Edit, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function CustomerManagement() {
  const { customers, isLoading, createCustomer, updateCustomer, uploadLogo } = useCustomers();
  const { toast } = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    template_name: '',
    logo_position: { x: 5, y: 5, width: 48, height: 16 },
    zpl_code: '',
    logo_url: ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setLogoFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, logo_url: previewUrl }));
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a JPG or PNG image.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let logoUrl = formData.logo_url;
      
      // Upload logo if file is selected
      if (logoFile) {
        const tempId = selectedCustomer?.id || `temp-${Date.now()}`;
        logoUrl = await uploadLogo(logoFile, tempId);
      }

      const customerData = {
        ...formData,
        logo_url: logoUrl
      };

      if (selectedCustomer) {
        updateCustomer({ id: selectedCustomer.id, ...customerData });
      } else {
        createCustomer(customerData);
      }

      // Reset form
      setFormData({
        customer_name: '',
        template_name: '',
        logo_position: { x: 5, y: 5, width: 48, height: 16 },
        zpl_code: '',
        logo_url: ''
      });
      setLogoFile(null);
      setSelectedCustomer(null);
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save customer data",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      customer_name: customer.customer_name,
      template_name: customer.template_name,
      logo_position: customer.logo_position,
      zpl_code: customer.zpl_code || '',
      logo_url: customer.logo_url || ''
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setSelectedCustomer(null);
    setFormData({
      customer_name: '',
      template_name: '',
      logo_position: { x: 5, y: 5, width: 48, height: 16 },
      zpl_code: '',
      logo_url: ''
    });
    setLogoFile(null);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-6">Loading customers...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Customer Label Templates</h1>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add Template
        </Button>
      </div>

      {/* Customer List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((customer) => (
          <Card key={customer.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{customer.customer_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{customer.template_name}</p>
                </div>
                <Badge variant={customer.is_active ? "default" : "secondary"}>
                  {customer.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo Preview */}
              {customer.logo_url && (
                <div className="w-full h-20 bg-muted rounded flex items-center justify-center">
                  <img 
                    src={customer.logo_url} 
                    alt={`${customer.customer_name} logo`}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
              
              {/* Position Info */}
              <div className="text-sm text-muted-foreground">
                Position: {customer.logo_position.x}mm, {customer.logo_position.y}mm<br />
                Size: {customer.logo_position.width}mm × {customer.logo_position.height}mm
              </div>
              
              {/* ZPL Status */}
              {customer.zpl_code && (
                <Badge variant="outline" className="text-xs">
                  ZPL Ready
                </Badge>
              )}
              
              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(customer)}>
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                {customer.logo_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={customer.logo_url} target="_blank" rel="noopener noreferrer">
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCustomer ? 'Edit Customer Template' : 'Add New Customer Template'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customer_name">Customer Name</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                    placeholder="e.g., ACME Corporation"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="template_name">Template Name</Label>
                  <Input
                    id="template_name"
                    value={formData.template_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, template_name: e.target.value }))}
                    placeholder="e.g., Standard Logo, Holiday Version"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="logo_upload">Logo Upload (JPG/PNG)</Label>
                  <div className="space-y-2">
                    <Input
                      id="logo_upload"
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handleFileChange}
                    />
                    {formData.logo_url && (
                      <div className="p-2 bg-muted rounded">
                        <img 
                          src={formData.logo_url} 
                          alt="Logo preview" 
                          className="max-w-full h-20 object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label>ZPL Conversion</Label>
                  <div className="space-y-2">
                    <Button type="button" variant="outline" asChild>
                      <a 
                        href="https://labelary.com/viewer.html" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Convert to ZPL at Labelary
                      </a>
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Upload your logo to Labelary, convert to ZPL, then paste the result below.
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="zpl_code">ZPL Code</Label>
                  <Textarea
                    id="zpl_code"
                    value={formData.zpl_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, zpl_code: e.target.value }))}
                    placeholder="Paste your ZPL code here..."
                    rows={4}
                  />
                </div>
              </div>

              {/* Right Column - Logo Positioner */}
              <div>
                <LogoPositioner
                  logoUrl={formData.logo_url}
                  position={formData.logo_position}
                  onPositionChange={(position) => 
                    setFormData(prev => ({ ...prev, logo_position: position }))
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedCustomer ? 'Update Template' : 'Create Template'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}