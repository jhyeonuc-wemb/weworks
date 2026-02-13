// 공통 Table 컴포넌트 - Tailwind UI 스타일 (박스 없음, 순수 테이블)

import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

// Table Container - 박스 제거, 순수 테이블만
export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="overflow-x-auto">
        <table ref={ref} className={cn("min-w-full divide-y divide-gray-300", className)} {...props}>
          {children}
        </table>
      </div>
    );
  }
);

Table.displayName = "Table";

// Table Header
export interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> { }

export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <thead ref={ref} className={cn("bg-slate-50/50 border-b border-slate-200", className)} {...props}>
        {children}
      </thead>
    );
  }
);

TableHeader.displayName = "TableHeader";

// Table Body
export interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> { }

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <tbody ref={ref} className={cn("divide-y divide-gray-200 bg-white", className)} {...props}>
        {children}
      </tbody>
    );
  }
);

TableBody.displayName = "TableBody";

// Table Row
export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> { }

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <tr ref={ref} className={className} {...props}>
        {children}
      </tr>
    );
  }
);

TableRow.displayName = "TableRow";

// Table Head Cell
export interface TableHeadProps extends HTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "center" | "right";
}

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, align = "left", children, ...props }, ref) => {
    const alignStyles = {
      left: "text-left",
      center: "text-center",
      right: "text-right"
    };

    return (
      <th
        ref={ref}
        scope="col"
        className={cn(
          "px-6 py-4 text-sm font-normal text-slate-500 tracking-tight",
          alignStyles[align],
          className
        )}
        {...props}
      >
        {children}
      </th>
    );
  }
);

TableHead.displayName = "TableHead";

// Table Cell
export interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "center" | "right";
  colSpan?: number;
  rowSpan?: number;
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, align = "left", colSpan, rowSpan, children, ...props }, ref) => {
    const alignStyles = {
      left: "text-left",
      center: "text-center",
      right: "text-right"
    };

    return (
      <td
        ref={ref}
        colSpan={colSpan}
        rowSpan={rowSpan}
        className={cn(
          "whitespace-nowrap px-3 py-4 text-sm text-gray-500",
          alignStyles[align],
          className
        )}
        {...props}
      >
        {children}
      </td>
    );
  }
);

TableCell.displayName = "TableCell";
