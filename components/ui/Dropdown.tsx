// 공통 Dropdown 컴포넌트 - 수지정산서 및 프로젝트 관리 스타일 기반

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DropdownOption {
    value: string | number;
    label: string;
}

export interface DropdownProps {
    value: string | number;
    onChange: (value: string | number) => void;
    options: DropdownOption[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    variant?: "premium" | "standard";
    align?: "left" | "center" | "right";
    listClassName?: string;
}

export const Dropdown = ({
    value,
    onChange,
    options,
    placeholder = "선택하세요",
    className,
    disabled = false,
    variant = "premium",
    align = "left",
    listClassName,
}: DropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Toggle dropdown
    const toggleDropdown = () => {
        if (disabled) return;

        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const dropdownHeight = Math.min(options.length * 40 + 10, 320); // Estimate max height (matches css max-h-80)

            let top = rect.bottom + 4; // Add a little gap
            const maxHeight = 320;

            // Decide whether to open up or down
            if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
                // Open upwards
                top = rect.top - dropdownHeight - 4;
                // Actually need to position bottom of dropdown at rect.top - gap
                // But simplified: we will use fixed positioning.
                // It's easier to just calculate 'top' for the container.
                // If opening up, we need the container to end at rect.top.
                // So top = rect.top - height. But height depends on content.
                // Let's stick to simple "check space" logic but let CSS handle height if possible?
                // No, portal needs explicit coords.
                // Let's re-calculate:
                // If we render into body, we can just use top/left.

                // Better approach for Portal:
                // Render a div at `top: rect.bottom` by default.
                // If spaceBelow is small, render at `bottom: window.innerHeight - rect.top`.
                // Let's use simple logic: if space below < 250, open up.
            }

            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    };

    // Update position or close on scroll/resize
    useEffect(() => {
        if (!isOpen) return;

        const updatePosition = () => {
            if (buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const estimatedHeight = Math.min(options.length * 40 + 10, 240);

                // Determine if we should open up
                const openUp = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

                setPosition({
                    top: openUp ? (rect.top - 4) : (rect.bottom + 4),
                    left: rect.left,
                    width: rect.width,
                    maxHeight: 240,
                    // We add a custom property to indicate direction for styling if needed
                    // but for fixed pos, 'top' is starting point.
                    // Wait, if opening up, `top` should be `rect.top - height`. 
                    // But we don't know exact height before render.
                    // Solution: Use `bottom` style if opening up? 
                    // Let's attach `bottom: window.innerHeight - rect.top + 4` if opening up.
                });
            }
        };

        updatePosition();

        const handleScroll = (e: Event) => {
            // 드랍다운 목록 자체의 스크롤인 경우 닫지 않음
            if (e.target instanceof HTMLElement && e.target.closest('.dropdown-portal-content')) {
                return;
            }

            // 페이지 스크롤 시 위치를 업데이트하거나, 버튼이 화면에서 사라지면 닫음
            if (buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                if (rect.bottom < 0 || rect.top > window.innerHeight) {
                    setIsOpen(false);
                } else {
                    // 위치 재계산을 위해 상태 업데이트
                    setPosition(prev => prev ? { ...prev } : null);
                }
            }
        };

        const handleResize = () => {
            setPosition(prev => prev ? { ...prev } : null);
        };

        const handleClickOutside = (e: MouseEvent) => {
            // Check if click is on button
            if (buttonRef.current && buttonRef.current.contains(e.target as Node)) {
                return;
            }
            // Check if click is inside dropdown (we need a ref for the portal content)
            // But since portal is in body, we can just check if target is inside the portal.
            // A simpler way is to stop propagation on portal click? 
            // Or use a global click listener that closes if not in button or portal.

            // We'll use a specific ID or class checking for the portal content?
            // Actually, we can just rely on the fact that if it's not the button, we close.
            // But we need to allow clicking inside the list.
            const target = e.target as HTMLElement;
            if (target.closest('.dropdown-portal-content')) {
                return;
            }
            setIsOpen(false);
        };

        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleResize);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, options.length]);

    const isPremium = variant === "premium";
    const selectedOption = options.find((opt) => opt.value === value);

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                disabled={disabled}
                onClick={toggleDropdown}
                className={cn(
                    "relative flex items-center w-full transition-all duration-200 focus:outline-none h-10 px-3 text-sm rounded-xl border border-gray-300 bg-white",
                    "text-gray-900 hover:bg-slate-50 hover:border-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0",
                    className,
                    isOpen && "border-gray-900 ring-2 ring-gray-900 ring-offset-0",
                    disabled && "bg-transparent text-gray-900 border-none cursor-default hover:bg-transparent shadow-none",
                    !isPremium && "justify-between"
                )}
            >
                <span className={cn(
                    "truncate flex-1 font-medium",
                    align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left"
                )}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                {!disabled && (
                    <ChevronDown
                        size={16}
                        className={cn(
                            "text-gray-400 flex-shrink-0 ml-2 transition-transform duration-200",
                            isOpen && "rotate-180"
                        )}
                    />
                )}
            </button>

            {isOpen && position && createPortal(
                <div
                    className={cn(
                        "dropdown-portal-content fixed z-[9999] bg-white rounded-xl border border-gray-200 shadow-xl py-1 animate-in fade-in zoom-in-95 duration-200",
                        listClassName
                    )}
                    style={{
                        left: position.left,
                        width: position.width,
                        // Handle up/down positioning
                        ...(window.innerHeight - buttonRef.current!.getBoundingClientRect().bottom < 250 && buttonRef.current!.getBoundingClientRect().top > 250
                            ? { bottom: window.innerHeight - buttonRef.current!.getBoundingClientRect().top + 4, top: 'auto', transformOrigin: 'bottom' }
                            : { top: buttonRef.current!.getBoundingClientRect().bottom + 4, bottom: 'auto', transformOrigin: 'top' }
                        )
                    }}
                >
                    <div className="overflow-y-auto custom-scrollbar max-h-80">
                        {options.length > 0 ? (
                            options.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "w-full px-3 py-2.5 text-left text-sm transition-all hover:bg-slate-50 whitespace-nowrap",
                                        value === option.value
                                            ? "bg-slate-100 text-gray-900 font-bold"
                                            : "text-gray-700 font-medium"
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-sm text-gray-400 italic text-center">데이터가 없습니다</div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};
