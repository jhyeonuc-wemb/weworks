"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface DraggablePanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
    triggerRect?: DOMRect | null;
    panelWidth?: number;
}

export function DraggablePanel({
    open,
    onOpenChange,
    title,
    description,
    children,
    className,
    panelWidth = 700,
}: DraggablePanelProps) {
    // position=null이면 CSS로 정중앙, position이 있으면 드래그 중 절대 좌표
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [mounted, setMounted] = useState(false);

    const dragRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const offsetRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (open) {
            setMounted(true);
            setPosition(null); // 열릴 때 항상 CSS 중앙 배치 초기화
        } else {
            setMounted(false);
            setPosition(null);
        }
    }, [open]);

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        if (!dragRef.current || !panelRef.current) return;

        // 드래그 시작 시 현재 패널 위치를 절대 좌표로 변환
        const rect = panelRef.current.getBoundingClientRect();
        setPosition({ x: rect.left, y: rect.top });
        setIsDragging(true);
        offsetRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    }, []);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            let newX = e.clientX - offsetRef.current.x;
            let newY = e.clientY - offsetRef.current.y;

            // 실제 패널 크기로 경계 계산
            const panelW = panelRef.current?.offsetWidth || panelWidth;
            const panelH = panelRef.current?.offsetHeight || 400;
            newX = Math.max(0, Math.min(newX, window.innerWidth - panelW));
            newY = Math.max(0, Math.min(newY, window.innerHeight - panelH));

            setPosition({ x: newX, y: newY });
        };

        const onMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
        }

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
    }, [isDragging, panelWidth]);

    if (!mounted) return null;
    if (typeof document === "undefined") return null;

    // position이 null이면 CSS transform으로 정중앙, 드래그 후엔 fixed 좌표
    const positionStyle: React.CSSProperties = position
        ? { position: "fixed", left: `${position.x}px`, top: `${position.y}px` }
        : { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    return createPortal(
        <div className="fixed inset-0 z-[9999] pointer-events-none">
            <div
                className="pointer-events-auto"
                style={positionStyle}
            >
                <div
                    ref={panelRef}
                    className={cn(
                        "overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200 flex flex-col",
                        isDragging && "cursor-grabbing ring-2 ring-indigo-500/20 select-none",
                        className
                    )}
                    style={{ width: `${panelWidth}px`, maxHeight: "85vh" }}
                >
                    {/* Drag Handle & Header */}
                    <div
                        ref={dragRef}
                        onMouseDown={onMouseDown}
                        className="flex items-center justify-between p-4 bg-gray-50/80 border-b border-gray-100 cursor-default transition-colors shrink-0"
                    >
                        <div className="flex items-center gap-3">
                            <div>
                                {title && <h2 className="text-base font-bold text-gray-900">{title}</h2>}
                                {description && <p className="text-xs text-gray-500">{description}</p>}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="h-8 w-8 p-0 rounded-full hover:bg-white hover:text-red-500 shadow-sm"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
                        {children}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
