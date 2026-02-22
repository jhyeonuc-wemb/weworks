"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
    id: string;
    message: string;
    type: ToastType | "confirm";
    title?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, title?: string) => void;
    confirm: (options: {
        message: string;
        title?: string;
        onConfirm: () => void;
        onCancel?: () => void;
        confirmText?: string;
        cancelText?: string;
    }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "info", title?: string) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type, title }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 3000);
    }, []);

    const confirm = useCallback((options: {
        message: string;
        title?: string;
        onConfirm: () => void;
        onCancel?: () => void;
        confirmText?: string;
        cancelText?: string;
    }) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, {
            id,
            message: options.message,
            title: options.title,
            type: "confirm",
            onConfirm: options.onConfirm,
            onCancel: options.onCancel,
            confirmText: options.confirmText || "확인",
            cancelText: options.cancelText || "취소"
        }]);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    const handleConfirm = (toast: Toast) => {
        if (toast.onConfirm) toast.onConfirm();
        removeToast(toast.id);
    };

    const handleCancel = (toast: Toast) => {
        if (toast.onCancel) toast.onCancel();
        removeToast(toast.id);
    };

    return (
        <ToastContext.Provider value={{ showToast, confirm }}>
            {children}

            {/* 일반 토스트 (상단 중앙) */}
            <div className="fixed top-6 inset-x-0 z-[100] flex flex-col items-center gap-3 pointer-events-none">
                {toasts.filter(t => t.type !== "confirm").map((toast) => (
                    <div
                        key={toast.id}
                        className={cn(
                            "pointer-events-auto flex min-w-[320px] max-w-md items-center gap-4 rounded-2xl border bg-white p-4 shadow-2xl animate-in slide-in-from-top-full duration-300",
                            toast.type === "success" && "border-green-100 bg-green-50/95", // 약간의 투명도 조절
                            toast.type === "error" && "border-red-100 bg-red-50/95",
                            toast.type === "warning" && "border-amber-100 bg-amber-50/95",
                            toast.type === "info" && "border-blue-100 bg-blue-50/95"
                        )}
                    >
                        <div className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                            toast.type === "success" && "bg-green-100 text-green-600",
                            toast.type === "error" && "bg-red-100 text-red-600",
                            toast.type === "warning" && "bg-amber-100 text-amber-600",
                            toast.type === "info" && "bg-blue-100 text-blue-600"
                        )}>
                            {toast.type === "success" && <CheckCircle2 className="h-5 w-5" />}
                            {toast.type === "error" && <AlertCircle className="h-5 w-5" />}
                            {toast.type === "warning" && <AlertCircle className="h-5 w-5" />}
                            {toast.type === "info" && <Info className="h-5 w-5" />}
                        </div>

                        <div className="flex-1 min-w-0">
                            {toast.title && <h4 className="text-sm font-bold text-gray-900 mb-0.5">{toast.title}</h4>}
                            <p className="text-sm text-gray-600 line-clamp-2">{toast.message}</p>
                        </div>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>

            {/* 확인 알림 (중앙) */}
            {toasts.filter(t => t.type === "confirm").length > 0 && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/5 animate-in fade-in duration-300">
                    <div className="flex flex-col gap-3">
                        {toasts.filter(t => t.type === "confirm").map((toast) => (
                            <div
                                key={toast.id}
                                className="flex min-w-[360px] max-w-md flex-col gap-4 rounded-[2rem] border border-blue-200 bg-white p-6 shadow-2xl ring-4 ring-blue-50/50 animate-in zoom-in-95 duration-300"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                        <Info className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {toast.title && <h3 className="text-base font-bold text-gray-900 mb-1">{toast.title}</h3>}
                                        <p className="text-sm leading-relaxed text-gray-600">{toast.message}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2 justify-end mt-2">
                                    <button
                                        onClick={() => handleCancel(toast)}
                                        className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors border border-gray-100"
                                    >
                                        {toast.cancelText}
                                    </button>
                                    <button
                                        onClick={() => handleConfirm(toast)}
                                        className="px-6 py-2 text-sm font-bold bg-gray-900 text-white hover:bg-gray-800 rounded-xl shadow-lg transition-all active:scale-95"
                                    >
                                        {toast.confirmText}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
