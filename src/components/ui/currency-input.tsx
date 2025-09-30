"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { formatInputCurrency, parseCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "value"> {
  value?: number | string;
  onValueChange?: (value: number) => void;
  showSymbol?: boolean;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onValueChange, showSymbol = true, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("");

    // Update display value when prop value changes
    React.useEffect(() => {
      const numValue = typeof value === "string" ? parseFloat(value) : value || 0;
      if (numValue === 0 && !displayValue) {
        setDisplayValue("");
      } else if (numValue > 0) {
        setDisplayValue(formatInputCurrency(numValue.toString()));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Allow empty input
      if (inputValue === "") {
        setDisplayValue("");
        onValueChange?.(0);
        return;
      }

      // Remove currency symbol if present
      const cleanedInput = inputValue.replace(/^\$/, "");

      // Format the input
      const formatted = formatInputCurrency(cleanedInput);
      setDisplayValue(formatted);

      // Parse and send numeric value to parent
      const numericValue = parseCurrency(formatted);
      onValueChange?.(numericValue);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Format with 2 decimal places on blur
      const numericValue = parseCurrency(displayValue);
      if (numericValue > 0) {
        setDisplayValue(formatInputCurrency(numericValue.toFixed(2)));
      }
      props.onBlur?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Select all on focus for easier editing
      e.target.select();
      props.onFocus?.(e);
    };

    return (
      <div className="relative">
        {showSymbol && displayValue && (
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
            $
          </span>
        )}
        <Input
          type="text"
          inputMode="decimal"
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          className={cn(showSymbol && displayValue ? "pl-6" : "", className)}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };