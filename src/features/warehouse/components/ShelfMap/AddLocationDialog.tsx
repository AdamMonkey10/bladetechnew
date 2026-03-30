// Dialog for adding new warehouse locations
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddLocationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (location: NewLocationData) => Promise<void>;
}

interface NewLocationData {
  aisleId: string;
  bayId: string;
  locationId: string;
  levelNumber: number;
  productId?: string;
}

const AddLocationDialog: React.FC<AddLocationDialogProps> = ({ 
  isOpen, 
  onClose, 
  onAdd 
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<NewLocationData>>({
    levelNumber: 11,
  });
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.aisleId || !formData.bayId || !formData.locationId) {
      setError('Please fill out all required location fields.');
      return;
    }

    if (!formData.levelNumber) {
      setError('Please provide a valid level number.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (onAdd) {
        await onAdd(formData as NewLocationData);
      }

      toast({
        title: "Location Added",
        description: `Successfully added level ${formData.levelNumber}`,
        duration: 3000,
      });

      // Reset form
      setFormData({
        levelNumber: 11,
      });
      onClose();
    } catch (err) {
      setError('Failed to add location. Please try again.');
      console.error('Error adding location:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError('');
    setFormData({
      levelNumber: 11,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Add New Location
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Aisle Selection */}
          <div className="space-y-2">
            <Label htmlFor="aisle" className="text-sm font-medium">
              Aisle *
            </Label>
            <Select 
              value={formData.aisleId || ''} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, aisleId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select aisle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aisle-a">Aisle A</SelectItem>
                <SelectItem value="aisle-b">Aisle B</SelectItem>
                <SelectItem value="aisle-c">Aisle C</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bay and Location */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bay" className="text-sm font-medium">
                Bay *
              </Label>
              <Input
                id="bay"
                value={formData.bayId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, bayId: e.target.value }))}
                placeholder="10, 20, 30..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium">
                Location *
              </Label>
              <Input
                id="location"
                value={formData.locationId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
                placeholder="A, B, C..."
                required
              />
            </div>
          </div>

          {/* Level Number */}
          <div className="space-y-2">
            <Label htmlFor="level" className="text-sm font-medium">
              Level Number *
            </Label>
            <Input
              id="level"
              type="number"
              value={formData.levelNumber || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, levelNumber: parseInt(e.target.value) || 11 }))}
              min="11"
              placeholder="11, 12, 13..."
              required
            />
          </div>

          {/* Optional Product ID */}
          <div className="space-y-2">
            <Label htmlFor="productId" className="text-sm font-medium">
              Product ID (Optional)
            </Label>
            <Input
              id="productId"
              value={formData.productId || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value }))}
              placeholder="Enter product ID if pre-assigned"
            />
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Add Location
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLocationDialog;