import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc' | null;
}

export const getSortIcon = (sortConfig: SortConfig, key: SortConfig['key']) => {
  if (sortConfig.key !== key) return <ChevronsUpDown className="h-4 w-4" />;
  if (sortConfig.direction === 'asc') return <ChevronUp className="h-4 w-4" />;
  if (sortConfig.direction === 'desc') return <ChevronDown className="h-4 w-4" />;
  return <ChevronsUpDown className="h-4 w-4" />;
};