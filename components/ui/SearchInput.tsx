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
            <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                    ref={ref}
                    type="search"
                    className={cn(
                        "block w-full h-9 rounded border-0 pl-10 pr-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm",
                        className
                    )}
                    {...props}
                />
            </div>
        );
    }
);

SearchInput.displayName = "SearchInput";
