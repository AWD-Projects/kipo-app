"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "value"> {
  value?: string;
  onValueChange?: (value: string) => void;
  prefix?: string;
  maxDigits?: number;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value, onValueChange, prefix = "+521", maxDigits = 10, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("");

    // Initialize with prefix
    React.useEffect(() => {
      if (!displayValue && !value) {
        setDisplayValue(prefix);
      } else if (value && !value.startsWith(prefix)) {
        setDisplayValue(prefix + value.replace(/\D/g, ""));
      } else if (value) {
        setDisplayValue(value);
      }
    }, [value, prefix]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Always ensure prefix is present
      if (!inputValue.startsWith(prefix)) {
        setDisplayValue(prefix);
        onValueChange?.(prefix);
        return;
      }

      // Extract digits after prefix
      const digitsOnly = inputValue.slice(prefix.length).replace(/\D/g, "");

      // Limit to maxDigits
      const limitedDigits = digitsOnly.slice(0, maxDigits);

      // Build new value
      const newValue = prefix + limitedDigits;
      setDisplayValue(newValue);
      onValueChange?.(newValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const cursorPosition = input.selectionStart || 0;

      // Prevent deletion of prefix
      if (
        (e.key === "Backspace" || e.key === "Delete") &&
        cursorPosition <= prefix.length
      ) {
        e.preventDefault();
        return;
      }

      // Prevent cursor from moving before prefix
      if (
        ["ArrowLeft", "Home"].includes(e.key) &&
        cursorPosition <= prefix.length
      ) {
        e.preventDefault();
        return;
      }

      props.onKeyDown?.(e);
    };

    const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const cursorPosition = input.selectionStart || 0;

      // Don't allow cursor before prefix
      if (cursorPosition < prefix.length) {
        input.setSelectionRange(prefix.length, prefix.length);
      }

      props.onClick?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      // Move cursor to end on focus
      setTimeout(() => {
        input.setSelectionRange(input.value.length, input.value.length);
      }, 0);

      props.onFocus?.(e);
    };

    // Validate phone number
    const isValid = React.useMemo(() => {
      const digits = displayValue.slice(prefix.length);
      return digits.length === maxDigits;
    }, [displayValue, prefix, maxDigits]);

    return (
      <div className="relative">
        <Input
          type="text"
          inputMode="numeric"
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          onFocus={handleFocus}
          className={cn(
            "font-mono",
            !isValid && displayValue.length > prefix.length && "border-destructive",
            className
          )}
          {...props}
        />
        {displayValue.length > prefix.length && !isValid && (
          <p className="text-xs text-destructive mt-1">
            Ingresa {maxDigits} dígitos después de {prefix}
          </p>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };