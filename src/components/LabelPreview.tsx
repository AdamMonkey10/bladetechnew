import { QRCodeCanvas } from 'qrcode.react';
import { PrintedLabel } from '@/hooks/usePrintedLabels';
import { useCustomerPOs } from '@/hooks/useCustomerPOs';
import { useCustomers } from '@/hooks/useCustomers';
import { LabelDimensions, DEFAULT_LABEL_SIZE, calculatePreviewPositions, getScaleFactor, isCompactLabel } from '@/utils/labelScaling';

interface LabelPreviewProps {
  record: PrintedLabel;
  labelSize?: LabelDimensions;
}

export function LabelPreview({ record, labelSize }: LabelPreviewProps) {
  const { pos } = useCustomerPOs();
  const { customers } = useCustomers();
  
  // Use provided dimensions or default
  const dimensions = labelSize || DEFAULT_LABEL_SIZE;
  const scale = getScaleFactor(dimensions);
  const positions = calculatePreviewPositions(dimensions);
  const compact = isCompactLabel(dimensions);
  
  // Find the PO for this label to get customer template info
  const associatedPO = pos.find(po => po.po_number === record.po);
  const customerTemplate = associatedPO?.customer_template_id 
    ? customers.find(template => template.id === associatedPO.customer_template_id)
    : null;

  // Use customer template logo and positioning if available, otherwise use default
  const logoPosition = customerTemplate?.logo_position || { 
    x: positions.logo.left, 
    y: positions.logo.top, 
    width: positions.logo.width, 
    height: positions.logo.height 
  };

  // Calculate scaled sizes
  const qrSize = Math.round(positions.qrCode.size);
  const baseFontSize = compact ? 12 * scale : 16 * scale;

  if (compact) {
    // Compact layout for 100x50mm style labels
    return (
      <div 
        className="relative bg-white border border-border p-1 mx-auto overflow-hidden"
        style={{ 
          width: `${dimensions.widthMm}mm`, 
          height: `${dimensions.heightMm}mm` 
        }}
      >
        {/* Logo - top left, smaller */}
        <img 
          src={customerTemplate?.logo_url || '/BTLogo.png'} 
          alt="Logo" 
          className="absolute object-contain"
          style={{
            top: `${positions.logo.top}mm`,
            left: `${positions.logo.left}mm`,
            width: `${positions.logo.width}mm`,
            height: `${positions.logo.height}mm`
          }}
        />
        
        {/* Customer + PO - below logo, left side */}
        <div 
          className="absolute text-left" 
          style={{ 
            top: `${positions.customer.top}mm`, 
            left: `${positions.customer.left}mm`,
            maxWidth: '35%'
          }}
        >
          <div 
            className="font-bold text-foreground truncate"
            style={{ fontSize: `${Math.round(baseFontSize * 1.2)}px` }}
          >
            {record.customer}
          </div>
          <div 
            className="text-foreground truncate"
            style={{ fontSize: `${Math.round(baseFontSize * 0.9)}px` }}
          >
            PO: {record.po}
          </div>
        </div>
        
        {/* SKU and Quantity - center */}
        <div 
          className="absolute text-center w-full" 
          style={{ top: `${positions.skuSection.top}mm` }}
        >
          <div 
            className="font-bold text-foreground"
            style={{ fontSize: `${Math.round(baseFontSize * 2)}px` }}
          >
            {record.sku}
          </div>
          <div 
            className="text-foreground"
            style={{ fontSize: `${Math.round(baseFontSize * 1)}px` }}
          >
            Qty: {record.quantity}
          </div>
        </div>
        
        {/* Details - bottom left */}
        <div 
          className="absolute text-foreground" 
          style={{ 
            bottom: `${positions.details.bottom}mm`, 
            left: `${positions.details.left}mm`,
            fontSize: `${Math.round(baseFontSize * 0.7)}px`
          }}
        >
          {record.invoice && <div>{record.invoice}</div>}
          <div>{record.print_date}</div>
        </div>
        
        {/* Operator/Laser - bottom right */}
        <div 
          className="absolute text-foreground text-right" 
          style={{ 
            bottom: `${positions.details.bottom}mm`, 
            right: `${dimensions.widthMm * 0.25}mm`,
            fontSize: `${Math.round(baseFontSize * 0.7)}px`
          }}
        >
          <div>{record.operator}</div>
          <div>{record.laser}</div>
        </div>
        
        {/* QR Code - top right */}
        <div 
          className="absolute" 
          style={{ 
            top: `${positions.qrCode.top}mm`, 
            right: `${positions.qrCode.right}mm` 
          }}
        >
          <QRCodeCanvas 
            value={`QA,${record.box_number || record.document_id || record.id}`} 
            size={qrSize} 
          />
        </div>
      </div>
    );
  }

  // Standard layout for square/tall labels
  return (
    <div 
      className="relative bg-white border border-border p-2 mx-auto"
      style={{ 
        width: `${dimensions.widthMm}mm`, 
        height: `${dimensions.heightMm}mm` 
      }}
    >
      {/* Customer Logo - if template exists, show in top left */}
      {customerTemplate && (
        <img 
          src={customerTemplate.logo_url} 
          alt={`${customerTemplate.customer_name} Logo`} 
          className="absolute object-contain"
          style={{
            top: `${logoPosition.y}mm`,
            left: `${logoPosition.x}mm`,
            width: `${logoPosition.width}mm`,
            height: `${logoPosition.height}mm`
          }}
        />
      )}
      
      {/* Bladetech Logo - always in top left position */}
      <img 
        src="/BTLogo.png" 
        alt="Bladetech Logo" 
        className="absolute object-contain"
        style={{
          top: `${positions.logo.top}mm`,
          left: `${positions.logo.left}mm`,
          width: `${positions.logo.width}mm`,
          height: `${positions.logo.height}mm`
        }}
      />
      
      {/* Customer info - positioned on the right side */}
      <div 
        className="absolute text-right" 
        style={{ 
          top: `${positions.customer.top}mm`, 
          right: `${positions.customer.right}mm` 
        }}
      >
        <div 
          className="font-bold text-foreground mb-1"
          style={{ fontSize: `${Math.round(baseFontSize * 1.125)}px` }}
        >
          {record.customer}
        </div>
        <div 
          className="text-foreground"
          style={{ fontSize: `${Math.round(baseFontSize * 0.875)}px` }}
        >
          PO: {record.po}
        </div>
      </div>
      
      {/* SKU and Quantity - positioned in center */}
      <div 
        className="absolute text-center w-full" 
        style={{ top: `${positions.skuSection.top}mm` }}
      >
        <div 
          className="font-bold text-foreground mb-2"
          style={{ fontSize: `${Math.round(baseFontSize * 1.5)}px` }}
        >
          {record.sku}
        </div>
        <div 
          className="text-foreground"
          style={{ fontSize: `${Math.round(baseFontSize * 0.875)}px` }}
        >
          Per Box: {record.quantity}
        </div>
      </div>
      
      {/* Details - positioned in bottom left */}
      <div 
        className="absolute text-foreground" 
        style={{ 
          bottom: `${positions.details.bottom}mm`, 
          left: `${positions.details.left}mm`,
          fontSize: `${Math.round(baseFontSize * 0.75)}px`
        }}
      >
        {record.invoice && <div className="mb-1">Invoice: {record.invoice}</div>}
        <div className="mb-1">Date: {record.print_date}</div>
        <div>Operator: {record.operator}</div>
      </div>
      
      {/* QR Code - positioned in bottom right */}
      <div 
        className="absolute" 
        style={{ 
          bottom: `${positions.qrCode.bottom}mm`, 
          right: `${positions.qrCode.right}mm` 
        }}
      >
        <QRCodeCanvas 
          value={`QA,${record.box_number || record.document_id || record.id}`} 
          size={qrSize} 
        />
      </div>
    </div>
  );
}