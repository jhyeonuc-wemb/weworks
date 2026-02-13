// 공통 SearchInput 컴포넌트 - Tailwind UI 스타일

import { InputHTMLAttributes, forwardRef } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    onSearch?: (value: string) => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
    ({ className, onSearch, ...props }, ref) => {
        return (
            <div className="relative group flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Search className="h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" aria-hidden="true" />
                </div>
                <input
                    ref={ref}
                    type="search"
                    className={cn(
                        "block w-full h-10 rounded-xl bg-white border border-gray-300 pl-11 pr-4 text-sm font-semibold focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 focus:outline-none transition-all duration-300",
                        className
                    )}
                    {...props}
                />
            </div>
        );
    }
);

SearchInput.displayName = "SearchInput";
