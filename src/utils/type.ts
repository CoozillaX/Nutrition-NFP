import type { DataTableFilterMetaData } from "primevue/datatable";

/**
 * Type guard to check if filter is of type DataTableFilterMetaData
 * @param f The filter to check
 * @returns true if f is DataTableFilterMetaData, false otherwise
 */
function isDataTableFilterMetaData(f: unknown): f is DataTableFilterMetaData {
  return (
    f !== null && typeof f === "object" && "value" in f && "matchMode" in f
  );
}

export { isDataTableFilterMetaData };
