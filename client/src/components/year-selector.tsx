import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getYears } from "@/api/core";
import { useAuth } from "@/context/auth-context";
import type { YearResponse } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface YearSelectorProps {
  selectedYearId: number | null;
  onYearChange: (yearId: number) => void;
  autoSelectCurrentYear?: boolean;
}

export function YearSelector({ selectedYearId, onYearChange, autoSelectCurrentYear = true }: YearSelectorProps) {
  const { isExternal, allowedYearIds, isLoadingYears } = useAuth();
  const { data: years, isLoading: isLoadingYearsList } = useQuery({
    queryKey: ["years"],
    queryFn: getYears,
  });

  const isFetchingExternalYears = isExternal && isLoadingYears;
  const allYears = years ?? [];
  const filteredYears = isExternal && allowedYearIds
    ? allYears.filter((y: YearResponse) => allowedYearIds.includes(y.id))
    : isExternal
      ? []
      : allYears;

  const sortedYears = useMemo(
    () => [...filteredYears].sort((a: YearResponse, b: YearResponse) => b.year - a.year),
    [filteredYears],
  );

  useEffect(() => {
    if (sortedYears.length === 0) return;
    if (selectedYearId !== null) return;
    if (!autoSelectCurrentYear) return;
    const currentYearVal = new Date().getFullYear();
    const match = sortedYears.find(y => y.year === currentYearVal) ?? sortedYears[0];
    onYearChange(match.id);
  }, [selectedYearId, sortedYears, onYearChange, autoSelectCurrentYear]);

  if (isFetchingExternalYears || isLoadingYearsList) {
    return <Skeleton className="w-[140px] h-9 rounded-lg" />;
  }

  if (isExternal) {
    return null;
  }

  const selectPlaceholder = isExternal && allowedYearIds && allowedYearIds.length === 1 && selectedYearId === null
    ? sortedYears[0]?.year.toString()
    : isLoadingYearsList ? "A carregar..." : "Selecionar ano";

  return (
    <Select
      value={selectedYearId?.toString() ?? ""}
      onValueChange={(val) => onYearChange(Number(val))}
    >
      <SelectTrigger className="w-[140px] font-bold">
        <SelectValue placeholder={selectPlaceholder} />
      </SelectTrigger>
      <SelectContent>
        {sortedYears.map((y: YearResponse) => (
          <SelectItem key={y.id} value={y.id.toString()}>
            {y.year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}