// 공통 Badge 컴포넌트 - Tailwind UI 스타일

import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "error" | "info" | "default";
  size?: "sm" | "md";
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "md", children, ...props }, ref) => {
    const variantStyles = {
      success: "bg-green-50 text-green-700 ring-green-600/20",
      warning: "bg-yellow-50 text-yellow-800 ring-yellow-600/20",
      error: "bg-red-50 text-red-700 ring-red-600/20",
      info: "bg-blue-50 text-blue-700 ring-blue-600/20",
      default: "bg-gray-50 text-gray-700 ring-gray-600/20"
    };

    const sizeStyles = {
      sm: "px-1.5 py-0.5 text-xs",
      md: "px-2 py-1 text-xs"
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full font-medium ring-1 ring-inset",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
