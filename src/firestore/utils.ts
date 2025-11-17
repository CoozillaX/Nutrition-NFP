import {
  query,
  limit,
  where,
  orderBy,
  collection,
  startAfter,
  getDocs,
  getCountFromServer
} from "firebase/firestore";
import { FilterMatchMode } from "@primevue/core/api";
import { db } from "@/firebase/storage";
import { isDataTableFilterMetaData } from "@/utils/type";

import type {
  Query,
  DocumentData,
  QueryDocumentSnapshot
} from "firebase/firestore";
import type { DataTableFilterEvent } from "primevue/datatable";

/**
 * Generate a Firestore query based on DataTable filters
 * @param collectionName The name of the Firestore collection
 * @param filters The DataTable filters
 * @returns A Firestore query
 */
function generateDatatableQueryByFilters(
  collectionName: string,
  filters: DataTableFilterEvent["filters"]
): Query<DocumentData, DocumentData> {
  let newQuery = query(collection(db, collectionName), orderBy("createdAt"));
  if (!filters) return newQuery;

  // CreatedAt filter
  if (isDataTableFilterMetaData(filters.createdAt)) {
    const { value: dateValue, matchMode: dateMode } = filters.createdAt || {};
    if ((dateValue?.length || 0) == 2) {
      if (!dateValue[0] || !dateValue[1]) return null; // Selecting, keep the query as is
      switch (dateMode) {
        case FilterMatchMode.BETWEEN:
          const startDate = new Date(dateValue[0]);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(dateValue[1]);
          endDate.setHours(23, 59, 59, 999);
          newQuery = query(
            newQuery,
            where("createdAt", ">=", startDate),
            where("createdAt", "<=", endDate)
          );
      }
    }
  }

  // Name filter
  if (isDataTableFilterMetaData(filters.name)) {
    const { value: nameValue, matchMode: nameMode } = filters.name || {};
    if (nameValue) {
      switch (nameMode) {
        case FilterMatchMode.EQUALS:
          newQuery = query(
            newQuery,
            where("name", "==", nameValue),
            orderBy("name")
          );
          break;
      }
    }
  }

  // Summary filter
  if (isDataTableFilterMetaData(filters.summary)) {
    const { value: summaryValue, matchMode: summaryMode } =
      filters.summary || {};
    if (summaryValue) {
      switch (summaryMode) {
        case FilterMatchMode.EQUALS:
          newQuery = query(
            newQuery,
            where("summary", "==", summaryValue),
            orderBy("summary")
          );
          break;
      }
    }
  }
  return newQuery;
}

/**
 * Get the Firestore document cursor for the given page number
 * @param pageNum The target page number (1-based)
 * @param baseQuery The base Firestore query
 * @param countPerRow The number of documents per page
 * @param cursors An array to store the document cursors
 * @returns The document cursor for the target page
 */
async function getCursorForPage<T extends DocumentData>(
  pageNum: number,
  baseQuery: Query<T, T>,
  countPerRow: number,
  cursors: QueryDocumentSnapshot<T, T>[]
): Promise<QueryDocumentSnapshot<T, T>> {
  // If we already have the cursor for the target page, return it
  if (cursors[pageNum - 1]) return cursors[pageNum - 1];

  // Find the last known cursor before the target page
  let lastKnownPage = -1;
  for (let i = pageNum - 1; i >= 0; i--) {
    if (cursors[i]) {
      lastKnownPage = i;
      break;
    }
  }

  // Start querying from the last known cursor
  let q = query(baseQuery, limit(countPerRow));
  if (lastKnownPage >= 0) {
    q = query(
      baseQuery,
      startAfter(cursors[lastKnownPage]),
      limit(countPerRow)
    );
  }

  // Fetch pages until we reach the target page
  for (let i = lastKnownPage + 1; i < pageNum; i++) {
    const snap = await getDocs(q);
    if (snap.empty) return null;
    cursors[i] = snap.docs[snap.docs.length - 1];

    q = query(baseQuery, startAfter(cursors[i]), limit(countPerRow));
  }
  return cursors[pageNum - 1];
}

/**
 * Fetch a page of documents from Firestore
 * @param pageNum The target page number (1-based)
 * @param baseQuery The base Firestore query
 * @param countPerRow The number of documents per page
 * @param cursors An array to store the document cursors
 * @returns An object containing the fetched data and updated cursors
 */
async function fetchByPage<T extends DocumentData>(
  pageNum: number,
  baseQuery: Query<T, T>,
  countPerRow: number,
  cursors: QueryDocumentSnapshot<T, T>[]
): Promise<{
  data: T[];
  cursors: QueryDocumentSnapshot<T, T>[];
}> {
  // Get the cursor for the target page
  const cursor = await getCursorForPage<T>(
    pageNum,
    baseQuery,
    countPerRow,
    cursors
  );

  // Build the query for the target page
  const q =
    cursor != null
      ? query(baseQuery, startAfter(cursor), limit(countPerRow))
      : query(baseQuery, limit(countPerRow));

  // Fetch the documents
  const snap = await getDocs(q);
  const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // Update the cursor for the current page
  if (snap.docs.length > 0) {
    cursors[pageNum] = snap.docs[snap.docs.length - 1];
  }
  return {
    data,
    cursors
  };
}

/**
 * Get the total count of documents matching the query
 * @param currQuery The Firestore query
 * @returns The total count of documents
 */
async function getTotalCount(currQuery: Query): Promise<number> {
  const snapCount = await getCountFromServer(currQuery);
  return snapCount.data().count || 0;
}

/**
 * Export data matching the query as a CSV file
 * @param filename The name of the CSV file to download, optional
 * @param currQuery The Firestore query
 */
async function exportCSV(currQuery: Query, filename?: string) {
  // fetch all data without pagination
  const count = await getTotalCount(currQuery);
  fetchByPage(0, currQuery, count, []).then(({ data }) => {
    // get all unique headers
    const headers = Array.from(new Set(data.flatMap((r) => Object.keys(r))));
    // convert to CSV format
    const csv = [
      headers.join(","),
      ...data.map((r) =>
        headers
          .map((h) => {
            const val = r[h];
            if (val === undefined || val === null) return "";
            return `"${String(val).replace(/"/g, '""').replace(/\n/g, " ")}"`;
          })
          .join(",")
      )
    ].join("\n");

    // download as CSV file
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "export.csv";
    a.click();
    URL.revokeObjectURL(url);
  });
}

export {
  generateDatatableQueryByFilters,
  fetchByPage,
  getTotalCount,
  exportCSV
};
