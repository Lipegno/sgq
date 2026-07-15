"use client"

import { type Table } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"

interface DataTableToolbarProps<TData> {
    table: Table<TData>
}

export function DataTableToolbar<TData>({
                                            table,
                                        }: DataTableToolbarProps<TData>) {
    return (
        <div className="flex items-center justify-between gap-2">
            <Input
                placeholder="Filter..."
                value={(table.getState().globalFilter as string) ?? ""}
                onChange={event =>
                    table.setGlobalFilter(event.target.value)
                }
                className="max-w-sm"
            />
        </div>
    )
}