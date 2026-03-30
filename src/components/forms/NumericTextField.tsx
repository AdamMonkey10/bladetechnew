import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateTimeSpent, detectDecimalPointErrors, suggestDecimalCorrection } from '@/utils/dataValidation';

interface NumericTextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  decimalPlaces?: number;
  className?: string;
  disabled?: boolean;
  // New props for time validation
  isTimeField?: boolean;
  activityName?: string;
  showValidation?: boolean;
}

export function NumericTextField({
  label,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  required = false,
  decimalPlaces = 3,
  className,
  disabled = false,
  isTimeField = false,
  activityName = '',
  showValidation = true,
}: NumericTextFieldProps) {
  // Validation for time fields
  const getValidationStatus = () => {
    if (!isTimeField || !value || !showValidation) return null;
    
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return null;
    
    const validation = validateTimeSpent(numericValue, activityName);
    const hasDecimalError = detectDecimalPointErrors(numericValue);
    const suggestedCorrection = suggestDecimalCorrection(numericValue);
    
    return {
      validation,
      hasDecimalError,
      suggestedCorrection
    };
  };

  const validationStatus = getValidationStatus();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow empty input
    if (inputValue === '') {
      onChange('');
      return;
    }
    
    // Only allow numeric input with decimal points
    const numericRegex = /^\d*\.?\d*$/;
    if (numericRegex.test(inputValue)) {
      onChange(inputValue);
    }
  };

  const handleBlur = () => {
    if (value && !isNaN(parseFloat(value))) {
      // Format to specified decimal places
      const formatted = parseFloat(value).toFixed(decimalPlaces);
      onChange(formatted);
    }
    onBlur?.();
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={label.replace(/\s+/g, '-').toLowerCase()}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={label.replace(/\s+/g, '-').toLowerCase()}
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        inputMode="decimal"
        pattern="[0-9.]*"
        className={cn(
          "h-12 text-lg", // Touch-friendly height and text size
          error && "border-destructive focus-visible:ring-destructive",
          validationStatus?.validation.errors.length && "border-destructive",
          validationStatus?.hasDecimalError && "border-amber-500"
        )}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      
      {/* Time validation warnings and errors */}
      {validationStatus && (
        <div className="space-y-1">
          {validationStatus.validation.errors.map((error, index) => (
            <Alert key={`error-${index}`} variant="destructive" className="py-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {error}
              </AlertDescription>
            </Alert>
          ))}
          
          {validationStatus.hasDecimalError && validationStatus.suggestedCorrection && (
            <Alert variant="destructive" className="py-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Did you mean {validationStatus.suggestedCorrection} hours? 
                <button
                  type="button"
                  onClick={() => onChange(validationStatus.suggestedCorrection!.toString())}
                  className="ml-2 text-sm underline hover:no-underline"
                >
                  Fix it
                </button>
              </AlertDescription>
            </Alert>
          )}
          
          {validationStatus.validation.warnings.map((warning, index) => (
            <Alert key={`warning-${index}`} className="py-2 border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-800">
                {warning}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
}