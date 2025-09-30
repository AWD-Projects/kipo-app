import * as React from "react";
import { cn } from "@/lib/utils";
import { Info, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";

export interface InfoBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "error";
  icon?: React.ReactNode;
  title?: string;
}

const variantStyles = {
  info: "bg-blue-50 border-blue-200 text-blue-900",
  success: "bg-green-50 border-green-200 text-green-900",
  warning: "bg-amber-50 border-amber-200 text-amber-900",
  error: "bg-red-50 border-red-200 text-red-900",
};

const variantIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

const InfoBanner = React.forwardRef<HTMLDivElement, InfoBannerProps>(
  ({ className, variant = "info", icon, title, children, ...props }, ref) => {
    const Icon = icon ? null : variantIcons[variant];

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-start gap-3 px-4 py-3 rounded-lg border text-sm",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {(icon || Icon) && (
          <div className="flex-shrink-0 mt-0.5">
            {icon || (Icon && <Icon className="h-4 w-4" />)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {title && <div className="font-medium mb-1">{title}</div>}
          <div className="text-sm opacity-90">{children}</div>
        </div>
      </div>
    );
  }
);

InfoBanner.displayName = "InfoBanner";

export { InfoBanner };