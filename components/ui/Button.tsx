// 공통 Button 컴포넌트 - Tailwind UI 스타일

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-xl font-bold transition-all duration-300 active:scale-95";

    const variantStyles = {
      primary: "bg-primary text-white hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20",
      secondary: "bg-white text-foreground border border-slate-200 hover:bg-slate-50 hover:shadow-sm",
      danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      ghost: "bg-transparent text-foreground/70 hover:bg-muted/50"
    };

    const sizeStyles = {
      sm: "h-8 px-4 text-xs",
      md: "h-10 px-6 text-sm",
      lg: "h-12 px-10 text-base"
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          props.disabled && "cursor-not-allowed opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
