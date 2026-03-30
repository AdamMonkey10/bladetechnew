import React, { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface LogoPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LogoPositionerProps {
  logoUrl?: string;
  position: LogoPosition;
  onPositionChange: (position: LogoPosition) => void;
}

export function LogoPositioner({ logoUrl, position, onPositionChange }: LogoPositionerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent, action: 'drag' | 'resize') => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDragStart({ x, y });
    if (action === 'drag') {
      setIsDragging(true);
    } else {
      setIsResizing(true);
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging && !isResizing) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging) {
      const deltaX = (x - dragStart.x) / scale;
      const deltaY = (y - dragStart.y) / scale;
      
      onPositionChange({
        ...position,
        x: Math.max(0, Math.min(101 - position.width, position.x + deltaX)),
        y: Math.max(0, Math.min(101 - position.height, position.y + deltaY))
      });
      
      setDragStart({ x, y });
    } else if (isResizing) {
      const newWidth = Math.max(10, Math.min(101 - position.x, (x - position.x * scale) / scale));
      const newHeight = Math.max(5, Math.min(101 - position.y, (y - position.y * scale) / scale));
      
      onPositionChange({
        ...position,
        width: newWidth,
        height: newHeight
      });
    }
  }, [isDragging, isResizing, dragStart, position, onPositionChange, scale]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // Add event listeners
  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const resetZoom = () => setScale(1);

  const handlePositionInputChange = (field: keyof LogoPosition, value: string) => {
    const numValue = parseFloat(value) || 0;
    onPositionChange({
      ...position,
      [field]: Math.max(0, Math.min(field === 'x' ? 101 - position.width : field === 'y' ? 101 - position.height : field === 'width' ? 101 - position.x : 101 - position.y, numValue))
    });
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Logo Position Preview (101mm × 101mm)</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-3 w-3" />
          </Button>
          <span className="text-xs px-2">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-3 w-3" />
          </Button>
          <Button variant="outline" size="sm" onClick={resetZoom}>
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Scale Slider */}
      <div className="space-y-2">
        <Label className="text-xs">Zoom Level</Label>
        <Slider
          value={[scale]}
          onValueChange={([value]) => setScale(value)}
          min={0.5}
          max={3}
          step={0.25}
          className="w-full"
        />
      </div>

      {/* Preview Container */}
      <div className="overflow-auto border rounded" style={{ maxHeight: '400px' }}>
        <div 
          ref={containerRef}
          className="relative bg-muted border-2 border-dashed border-border mx-auto"
          style={{ 
            width: `${303 * scale}px`, 
            height: `${303 * scale}px`,
            minWidth: '303px',
            minHeight: '303px'
          }}
        >
        {/* Logo preview */}
        <div
          className="absolute border-2 border-primary bg-background/80 cursor-move select-none"
          style={{
            left: `${(position.x / 101) * 100}%`,
            top: `${(position.y / 101) * 100}%`,
            width: `${(position.width / 101) * 100}%`,
            height: `${(position.height / 101) * 100}%`,
          }}
          onMouseDown={(e) => handleMouseDown(e, 'drag')}
        >
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="Logo preview" 
              className="w-full h-full object-contain"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
              Logo
            </div>
          )}
          
          {/* Resize handle */}
          <div
            className="absolute bottom-0 right-0 w-3 h-3 bg-primary cursor-se-resize"
            onMouseDown={(e) => {
              e.stopPropagation();
              handleMouseDown(e, 'resize');
            }}
          />
        </div>
        
        {/* Position info */}
        <div className="absolute bottom-2 left-2 text-xs bg-background px-2 py-1 rounded shadow-sm">
          x: {position.x.toFixed(1)}mm, y: {position.y.toFixed(1)}mm<br />
          w: {position.width.toFixed(1)}mm, h: {position.height.toFixed(1)}mm
        </div>
      </div>
      </div>

      {/* Precise Position Controls */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="pos-x" className="text-xs">X Position (mm)</Label>
          <Input
            id="pos-x"
            type="number"
            value={position.x.toFixed(1)}
            onChange={(e) => handlePositionInputChange('x', e.target.value)}
            step="0.1"
            min="0"
            max={101 - position.width}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pos-y" className="text-xs">Y Position (mm)</Label>
          <Input
            id="pos-y"
            type="number"
            value={position.y.toFixed(1)}
            onChange={(e) => handlePositionInputChange('y', e.target.value)}
            step="0.1"
            min="0"
            max={101 - position.height}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pos-width" className="text-xs">Width (mm)</Label>
          <Input
            id="pos-width"
            type="number"
            value={position.width.toFixed(1)}
            onChange={(e) => handlePositionInputChange('width', e.target.value)}
            step="0.1"
            min="5"
            max={101 - position.x}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pos-height" className="text-xs">Height (mm)</Label>
          <Input
            id="pos-height"
            type="number"
            value={position.height.toFixed(1)}
            onChange={(e) => handlePositionInputChange('height', e.target.value)}
            step="0.1"
            min="2"
            max={101 - position.y}
            className="h-8 text-xs"
          />
        </div>
      </div>
    </Card>
  );
}