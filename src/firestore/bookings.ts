import {
  collection,
  query,
  limit,
  getDocs,
  doc,
  deleteDoc,
  where
} from "firebase/firestore";
import { db } from "@/firebase/storage";
import { currentUser } from "@/firebase/auth";
import request from "@/utils/request";
import type { AxiosResponse } from "axios";

const collectionName = "bookings";

/**
 * Check if the current user has booked the given slot
 * @param slotId The slot ID to check
 * @returns true if booked, false otherwise
 */
async function isBooked(slotId: string): Promise<boolean> {
  try {
    // Ensure user is authenticated
    if (!currentUser.value) {
      return false;
    }
    // Query bookings collection for a matching document
    const q = query(
      collection(db, collectionName),
      where("slotId", "==", slotId),
      where("userId", "==", currentUser.value.uid),
      limit(1)
    );
    const doc = await getDocs(q);
    return !doc.empty;
  } catch (error) {
    console.error("Error checking booking:", error);
    return false;
  }
}

/**
 * Add a booking for the current user for the given slot
 * @param slotId The slot ID to book
 * @returns A promise that resolves when the booking is added
 */
async function addBooking(
  slotId: string
): Promise<AxiosResponse<any, any, {}>> {
  return request.get("/bookings/add", {
    params: { slotId }
  });
}

/**
 * Delete a booking for the current user for the given slot
 * @param slotId The slot ID to delete the booking for
 * @returns A promise that resolves when the booking is deleted
 */
async function deleteBooking(slotId: string): Promise<void> {
  try {
    // Ensure user is authenticated
    if (!currentUser.value) {
      throw new Error("User not authenticated");
    }
    // Find the booking document
    const q = query(
      collection(db, collectionName),
      where("slotId", "==", slotId),
      where("userId", "==", currentUser.value.uid),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      throw new Error("Booking not found");
    }
    // Delete the booking document
    const docId = snap.docs[0].id;
    await deleteDoc(doc(db, collectionName, docId));
    return Promise.resolve();
  } catch (err) {
    return Promise.reject(err);
  }
}

export { isBooked, addBooking, deleteBooking };
