"use client";

import React from "react";
import { Dialog } from "./Dialog";
import { Button } from "./Button";
import { AlertCircle, CheckCircle2, Info, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertType = "info" | "success" | "warning" | "error" | "confirm";

interface AlertDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    message: string;
    type?: AlertType;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
}

export function AlertDialog({
    open,
    onOpenChange,
    title,
    message,
    type = "info",
    onConfirm,
    onCancel,
    confirmText = "확인",
    cancelText = "취소",
}: AlertDialogProps) {
    const getIcon = () => {
        switch (type) {
            case "success":
                return <CheckCircle2 className="h-6 w-6 text-green-500" />;
            case "warning":
                return <AlertCircle className="h-6 w-6 text-amber-500" />;
            case "error":
                return <AlertCircle className="h-6 w-6 text-red-500" />;
            case "confirm":
                return <HelpCircle className="h-6 w-6 text-blue-500" />;
            default:
                return <Info className="h-6 w-6 text-blue-500" />;
        }
    };

    const handleConfirm = () => {
        if (onConfirm) onConfirm();
        onOpenChange(false);
    };

    const handleCancel = () => {
        if (onCancel) onCancel();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange} className="max-w-md">
            <div className="flex flex-col items-center text-center p-2">
                <div className={cn(
                    "mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50",
                    type === "success" && "bg-green-50",
                    type === "warning" && "bg-amber-50",
                    type === "error" && "bg-red-50",
                    type === "confirm" && "bg-blue-50"
                )}>
                    {getIcon()}
                </div>
                
                {title && (
                    <h3 className="mb-2 text-lg font-bold text-gray-900">
                        {title}
                    </h3>
                )}
                
                <p className="mb-8 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                    {message}
                </p>

                <div className="flex w-full gap-3">
                    {type === "confirm" && (
                        <Button
                            variant="secondary"
                            onClick={handleCancel}
                            className="flex-1 h-11 rounded-xl font-medium"
                        >
                            {cancelText}
                        </Button>
                    )}
                    <Button
                        variant={type === "error" ? "danger" : "primary"}
                        onClick={handleConfirm}
                        className={cn(
                            "flex-1 h-11 rounded-xl font-semibold shadow-sm transition-all active:scale-95",
                            type === "error" && "bg-red-600 hover:bg-red-700",
                            type !== "error" && "bg-gray-900 hover:bg-gray-800"
                        )}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Dialog>
    );
}
