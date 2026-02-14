"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface DraggablePanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
    triggerRect?: DOMRect | null; // 버튼 위치 정보
}

export function DraggablePanel({
    open,
    onOpenChange,
    title,
    description,
    children,
    className,
    triggerRect,
}: DraggablePanelProps) {
    // 초기 위치를 화면 밖으로 설정하여 0,0에서 나타나는 현상 방지
    const [position, setPosition] = useState({ x: -2000, y: -2000 });
    const [isDragging, setIsDragging] = useState(false);
    const [mounted, setMounted] = useState(false);

    const dragRef = useRef<HTMLDivElement>(null);
    const offsetRef = useRef({ x: 0, y: 0 });

    // 화면을 그리기 전에 위치를 즉시 잡음 (깜빡임 방지)
    // React 19에서는 useLayoutEffect를 직접 import 해야함. 상단 import 문이 이미 있으므로 생략 가능하나 컴포넌트 내부에선 안됨.
    // 상단에 React와 함께 import 되어있으므로 바로 사용.

    useEffect(() => {
        if (open) {
            setMounted(true);

            // 즉시 시작 위치 설정
            const startX = triggerRect ? triggerRect.left : window.innerWidth / 2 - 350;
            const startY = triggerRect ? triggerRect.top : 100;
            setPosition({ x: startX, y: startY });

            // 버튼에서 화면 중앙으로 "슝" 하고 이동하는 애니메이션 효과
            const timer = setTimeout(() => {
                setPosition({
                    x: window.innerWidth / 2 - 350,
                    y: 100
                });
            }, 10); // 아주 짧은 지연시간 뒤에 이동

            return () => clearTimeout(timer);
        } else {
            const timer = setTimeout(() => {
                setMounted(false);
                setPosition({ x: -2000, y: -2000 }); // 닫을 때 다시 밖으로
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [open, triggerRect]);

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        if (dragRef.current) {
            setIsDragging(true);
            offsetRef.current = {
                x: e.clientX - position.x,
                y: e.clientY - position.y,
            };
        }
    }, [position]);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            let newX = e.clientX - offsetRef.current.x;
            let newY = e.clientY - offsetRef.current.y;

            // 화면 경계 제한
            newX = Math.max(0, Math.min(newX, window.innerWidth - 700)); // 700은 패널 너비
            newY = Math.max(0, Math.min(newY, window.innerHeight - 500));

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
    }, [isDragging]);

    if (!mounted && !open) return null;

    if (typeof document === "undefined") return null;

    return createPortal(
        <>
            {/* Global overlay to handle drag constraints if needed, but here we want to allow underlying clicks */}
            <div
                className={cn(
                    "fixed inset-0 z-[9999] pointer-events-none transition-opacity duration-300",
                    open ? "opacity-100" : "opacity-0 invisible"
                )}
            >
                <div
                    className={cn(
                        "pointer-events-auto absolute transform ease-out",
                        !isDragging && "transition-all duration-300",
                        open ? "opacity-100 scale-100" : "opacity-0 scale-95 translate-y-4"
                    )}
                    style={{
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                    }}
                >
                    <div
                        className={cn(
                            "pointer-events-auto relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200 flex flex-col",
                            isDragging && "cursor-grabbing ring-2 ring-indigo-500/20 select-none",
                            className
                        )}
                        style={{ width: '700px', maxHeight: '85vh' }}
                    >
                        {/* Drag Handle & Header */}
                        <div
                            ref={dragRef}
                            onMouseDown={onMouseDown}
                            className="flex items-center justify-between p-4 bg-gray-50/80 border-b border-gray-100 cursor-grab active:cursor-grabbing hover:bg-gray-100/80 transition-colors shrink-0"
                        >
                            <div className="flex items-center gap-3">
                                <GripHorizontal className="h-5 w-5 text-gray-400" />
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
            </div>
        </>
        , document.body);
}
