import { Button } from "@/components/ui/button"

export function DataTablePagination({ table }: { table: any }) {
    return (
        <div className="flex items-center justify-between pt-2">
      <span className="text-sm text-muted-foreground">
        Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
      </span>

            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    ←
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    →
                </Button>
            </div>
        </div>
    )
}