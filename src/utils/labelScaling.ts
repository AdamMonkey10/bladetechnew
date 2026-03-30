// Label scaling utilities for dynamic label sizes
// 203 DPI printer = ~8 dots per mm

export interface LabelDimensions {
  widthMm: number;
  heightMm: number;
}

export interface LabelDimensionsDots extends LabelDimensions {
  widthDots: number;
  heightDots: number;
}

export interface ElementPosition {
  x: number;
  y: number;
}

export interface ElementPositionWithSize extends ElementPosition {
  width?: number;
  height?: number;
  fontSize?: number;
}

export interface LabelElementPositions {
  logo: ElementPositionWithSize;
  customer: ElementPositionWithSize;
  po: ElementPositionWithSize;
  sku: ElementPositionWithSize;
  quantity: ElementPositionWithSize;
  invoice: ElementPositionWithSize;
  date: ElementPositionWithSize;
  operator: ElementPositionWithSize;
  laser: ElementPositionWithSize;
  qrCode: ElementPositionWithSize;
}

export interface PalletElementPositions {
  logo: ElementPositionWithSize;
  customer: ElementPositionWithSize;
  po: ElementPositionWithSize;
  skuSection: ElementPosition;
  totalUnits: ElementPositionWithSize;
  totalBoxes: ElementPositionWithSize;
  qrCode: ElementPositionWithSize;
}

// Convert mm to ZPL dots (203 DPI = ~8 dots per mm)
export const mmToZplDots = (mm: number): number => Math.round(mm * 8);

// Convert dots to mm
export const dotsToMm = (dots: number): number => dots / 8;

// Default label size (100mm x 100mm)
export const DEFAULT_LABEL_SIZE: LabelDimensions = {
  widthMm: 100,
  heightMm: 100,
};

// Common label size presets
export const LABEL_PRESETS: { name: string; dimensions: LabelDimensions }[] = [
  { name: '100mm x 100mm', dimensions: { widthMm: 100, heightMm: 100 } },
  { name: '100mm x 50mm', dimensions: { widthMm: 100, heightMm: 50 } },
  { name: '4" x 6" (101 x 152mm)', dimensions: { widthMm: 101, heightMm: 152 } },
  { name: 'Custom', dimensions: { widthMm: 0, heightMm: 0 } },
];

// Get full dimensions including dots
export const getLabelDimensionsDots = (dimensions: LabelDimensions): LabelDimensionsDots => ({
  ...dimensions,
  widthDots: mmToZplDots(dimensions.widthMm),
  heightDots: mmToZplDots(dimensions.heightMm),
});

// Base reference dimensions (101mm x 101mm = 808 dots)
const BASE_WIDTH_MM = 101;
const BASE_HEIGHT_MM = 101;

// Calculate scale factor for fonts and elements
export const getScaleFactor = (dimensions: LabelDimensions): number => {
  const minDimension = Math.min(dimensions.widthMm, dimensions.heightMm);
  return minDimension / BASE_WIDTH_MM;
};

// Scale a font size based on label dimensions
export const scaleFontSize = (baseFontSize: number, dimensions: LabelDimensions): number => {
  const scale = getScaleFactor(dimensions);
  return Math.round(baseFontSize * scale);
};

// Detect if this is a wide/short label (aspect ratio <= 0.6)
export const isCompactLabel = (dimensions: LabelDimensions): boolean => {
  return dimensions.heightMm / dimensions.widthMm <= 0.6;
};

// Calculate element positions for COMPACT labels (100x50mm style)
// Layout: Logo (top-left, bigger), Customer/PO (top-right), SKU/Qty (center-lower), 
// Details (bottom-left single row), QR (bottom-right)
const calculateCompactLabelPositions = (dimensions: LabelDimensions): LabelElementPositions => {
  const dims = getLabelDimensionsDots(dimensions);
  
  // For 100x50mm: 800 dots wide x 400 dots tall
  const leftX = Math.round(dims.widthDots * 0.02); // 2% margin
  const rightX = Math.round(dims.widthDots * 0.55); // Right section for customer/PO
  
  // Font sizes scaled for compact label
  const customerFontSize = Math.round(dims.heightDots * 0.10); // ~40 on 400 dots
  const poFontSize = Math.round(dims.heightDots * 0.08); // ~32 on 400 dots  
  const skuFontSize = Math.round(dims.heightDots * 0.20); // ~80 on 400 dots - LARGE
  const qtyFontSize = Math.round(dims.heightDots * 0.10); // ~40 on 400 dots
  const detailFontSize = Math.round(dims.heightDots * 0.055); // ~22 on 400 dots
  
  // Detail row - all on same Y at bottom
  const detailY = Math.round(dims.heightDots * 0.88);
  
  return {
    logo: {
      x: leftX,
      y: Math.round(dims.heightDots * 0.05),
      width: Math.round(dims.widthDots * 0.30),
      height: Math.round(dims.heightDots * 0.35), // Bigger logo
    },
    customer: {
      x: rightX, // Top-right area
      y: Math.round(dims.heightDots * 0.08),
      fontSize: customerFontSize,
    },
    po: {
      x: rightX, // Below customer name
      y: Math.round(dims.heightDots * 0.22),
      fontSize: poFontSize,
    },
    sku: {
      x: 0, // Centered
      y: Math.round(dims.heightDots * 0.48), // Lower on label (~50%)
      fontSize: skuFontSize,
    },
    quantity: {
      x: 0, // Centered
      y: Math.round(dims.heightDots * 0.68), // Below SKU (~65%)
      fontSize: qtyFontSize,
    },
    // All details in single horizontal row at bottom-left
    invoice: {
      x: leftX,
      y: detailY,
      fontSize: detailFontSize,
    },
    date: {
      x: Math.round(dims.widthDots * 0.18), // Spaced across bottom
      y: detailY,
      fontSize: detailFontSize,
    },
    operator: {
      x: Math.round(dims.widthDots * 0.38), // Continue spacing
      y: detailY,
      fontSize: detailFontSize,
    },
    laser: {
      x: Math.round(dims.widthDots * 0.52), // Before QR code
      y: detailY,
      fontSize: detailFontSize,
    },
    qrCode: {
      x: Math.round(dims.widthDots * 0.78), // Bottom-right
      y: Math.round(dims.heightDots * 0.62), // Bottom area
      width: 3, // Smaller QR magnification for compact label
    },
  };
};

// Calculate element positions for STANDARD labels (100x100mm style)
const calculateStandardLabelPositions = (dimensions: LabelDimensions): LabelElementPositions => {
  const dims = getLabelDimensionsDots(dimensions);
  const scale = getScaleFactor(dimensions);
  
  return {
    logo: {
      x: Math.round(dims.widthDots * 0.062),
      y: Math.round(dims.heightDots * 0.062),
      width: Math.round(dims.widthDots * 0.52),
      height: Math.round(dims.heightDots * 0.178),
    },
    customer: {
      x: 7,
      y: Math.round(dims.heightDots * 0.33),
      fontSize: scaleFontSize(72, dimensions),
    },
    po: {
      x: 7,
      y: Math.round(dims.heightDots * 0.43),
      fontSize: scaleFontSize(36, dimensions),
    },
    sku: {
      x: 0,
      y: Math.round(dims.heightDots * 0.54),
      fontSize: scaleFontSize(96, dimensions),
    },
    quantity: {
      x: 0,
      y: Math.round(dims.heightDots * 0.65),
      fontSize: scaleFontSize(36, dimensions),
    },
    invoice: {
      x: Math.round(dims.widthDots * 0.056),
      y: Math.round(dims.heightDots * 0.82),
      fontSize: scaleFontSize(32, dimensions),
    },
    date: {
      x: Math.round(dims.widthDots * 0.056),
      y: Math.round(dims.heightDots * 0.87),
      fontSize: scaleFontSize(32, dimensions),
    },
    operator: {
      x: Math.round(dims.widthDots * 0.056),
      y: Math.round(dims.heightDots * 0.92),
      fontSize: scaleFontSize(32, dimensions),
    },
    laser: {
      x: Math.round(dims.widthDots * 0.056),
      y: Math.round(dims.heightDots * 0.97),
      fontSize: scaleFontSize(32, dimensions),
    },
    qrCode: {
      x: Math.round(dims.widthDots * 0.75),
      y: Math.round(dims.heightDots * 0.75),
      width: Math.round(5 * scale),
    },
  };
};

// Main function - automatically selects layout based on aspect ratio
export const calculateBoxLabelPositions = (dimensions: LabelDimensions): LabelElementPositions => {
  if (isCompactLabel(dimensions)) {
    return calculateCompactLabelPositions(dimensions);
  }
  return calculateStandardLabelPositions(dimensions);
};

// Calculate pallet label positions (also supports compact layout)
export const calculatePalletLabelPositions = (dimensions: LabelDimensions): PalletElementPositions => {
  const dims = getLabelDimensionsDots(dimensions);
  const scale = getScaleFactor(dimensions);
  const compact = isCompactLabel(dimensions);
  
  if (compact) {
    // Compact pallet label layout
    return {
      logo: {
        x: Math.round(dims.widthDots * 0.02),
        y: Math.round(dims.heightDots * 0.05),
      },
      customer: {
        x: 15,
        y: Math.round(dims.heightDots * 0.40),
        fontSize: Math.round(dims.heightDots * 0.12),
      },
      po: {
        x: 15,
        y: Math.round(dims.heightDots * 0.58),
        fontSize: Math.round(dims.heightDots * 0.08),
      },
      skuSection: {
        x: Math.round(dims.widthDots * 0.30),
        y: Math.round(dims.heightDots * 0.35),
      },
      totalUnits: {
        x: Math.round(dims.widthDots * 0.30),
        y: Math.round(dims.heightDots * 0.12),
        fontSize: Math.round(dims.heightDots * 0.18),
      },
      totalBoxes: {
        x: Math.round(dims.widthDots * 0.30),
        y: Math.round(dims.heightDots * 0.35),
        fontSize: Math.round(dims.heightDots * 0.12),
      },
      qrCode: {
        x: Math.round(dims.widthDots * 0.78),
        y: Math.round(dims.heightDots * 0.08),
        width: 3,
      },
    };
  }
  
  // Standard pallet label layout
  return {
    logo: {
      x: Math.round(dims.widthDots * 0.062),
      y: Math.round(dims.heightDots * 0.062),
    },
    customer: {
      x: 15,
      y: Math.round(dims.heightDots * 0.25),
      fontSize: scaleFontSize(48, dimensions),
    },
    po: {
      x: 15,
      y: Math.round(dims.heightDots * 0.30),
      fontSize: scaleFontSize(24, dimensions),
    },
    skuSection: {
      x: 0,
      y: Math.round(dims.heightDots * 0.35),
    },
    totalUnits: {
      x: 0,
      y: Math.round(dims.heightDots * 0.65),
      fontSize: scaleFontSize(72, dimensions),
    },
    totalBoxes: {
      x: 0,
      y: Math.round(dims.heightDots * 0.75),
      fontSize: scaleFontSize(48, dimensions),
    },
    qrCode: {
      x: Math.round(dims.widthDots * 0.75),
      y: Math.round(dims.heightDots * 0.87),
      width: Math.round(5 * scale),
    },
  };
};

// Validation helpers
export const validateLabelDimensions = (dimensions: LabelDimensions): { valid: boolean; error?: string } => {
  const MIN_SIZE = 25;
  const MAX_SIZE = 300;
  
  if (dimensions.widthMm < MIN_SIZE) {
    return { valid: false, error: `Width must be at least ${MIN_SIZE}mm` };
  }
  if (dimensions.heightMm < MIN_SIZE) {
    return { valid: false, error: `Height must be at least ${MIN_SIZE}mm` };
  }
  if (dimensions.widthMm > MAX_SIZE) {
    return { valid: false, error: `Width cannot exceed ${MAX_SIZE}mm` };
  }
  if (dimensions.heightMm > MAX_SIZE) {
    return { valid: false, error: `Height cannot exceed ${MAX_SIZE}mm` };
  }
  
  return { valid: true };
};

// Calculate preview positions in mm for CSS styling
export const calculatePreviewPositions = (dimensions: LabelDimensions) => {
  const scale = getScaleFactor(dimensions);
  const compact = isCompactLabel(dimensions);
  
  if (compact) {
    return {
      logo: {
        top: dimensions.heightMm * 0.05,
        left: dimensions.widthMm * 0.02,
        width: dimensions.widthMm * 0.28,
        height: dimensions.heightMm * 0.25,
      },
      customer: {
        top: dimensions.heightMm * 0.38,
        left: dimensions.widthMm * 0.02,
      },
      skuSection: {
        top: dimensions.heightMm * 0.25,
      },
      details: {
        bottom: dimensions.heightMm * 0.08,
        left: dimensions.widthMm * 0.02,
      },
      qrCode: {
        top: dimensions.heightMm * 0.08,
        right: dimensions.widthMm * 0.02,
        size: 60 * scale,
      },
    };
  }
  
  return {
    logo: {
      top: dimensions.heightMm * 0.062,
      left: dimensions.widthMm * 0.062,
      width: dimensions.widthMm * 0.52,
      height: dimensions.heightMm * 0.178,
    },
    customer: {
      top: dimensions.heightMm * 0.25,
      right: dimensions.widthMm * 0.06,
    },
    skuSection: {
      top: dimensions.heightMm * 0.45,
    },
    details: {
      bottom: dimensions.heightMm * 0.17,
      left: dimensions.widthMm * 0.06,
    },
    qrCode: {
      bottom: dimensions.heightMm * 0.05,
      right: dimensions.widthMm * 0.06,
      size: 90 * scale,
    },
  };
};
