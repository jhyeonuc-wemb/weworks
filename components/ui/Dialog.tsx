"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

export function Dialog({
    open,
    onOpenChange,
    title,
    description,
    children,
    className,
}: DialogProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (open) {
            setMounted(true);
            document.body.style.overflow = "hidden";
        } else {
            const timer = setTimeout(() => setMounted(false), 300);
            document.body.style.overflow = "unset";
            return () => clearTimeout(timer);
        }
    }, [open]);

    if (!mounted && !open) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300",
                open ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => onOpenChange(false)}
            />

            {/* Modal Content */}
            <div
                className={cn(
                    "relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300",
                    open ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-4 opacity-0",
                    className
                )}
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        {title && <h2 className="text-xl font-bold text-gray-900">{title}</h2>}
                        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="mt-2 text-slate-600">
                    {children}
                </div>
            </div>
        </div>
    );
}
