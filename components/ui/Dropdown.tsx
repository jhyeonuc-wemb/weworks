// 공통 Dropdown 컴포넌트 - 수지정산서 스타일 기반

import { useState, useRef, useEffect } from "react";
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
}

export const Dropdown = ({
    value,
    onChange,
    options,
    placeholder = "선택하세요",
    className,
}: DropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div ref={dropdownRef} className={cn("relative", className)}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-between gap-3 h-9 rounded border border-gray-300 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors min-w-[180px]"
            >
                <span className="truncate">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    size={16}
                    className={cn("text-gray-400 transition-transform flex-shrink-0", isOpen && "rotate-180")}
                />
            </button>

            {isOpen && (
                <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg py-2 animate-in zoom-in-95 fade-in duration-200">
                    <div className="max-h-80 overflow-y-auto">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50",
                                    value === option.value
                                        ? "bg-gray-50 text-gray-900 font-medium"
                                        : "text-gray-700"
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
