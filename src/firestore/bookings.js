import axios from "axios";
import {
  collection,
  query,
  limit,
  getDocs,
  doc,
  deleteDoc,
  where
} from "firebase/firestore";
import { db, currentUser } from "@/firebase/init";

const functionUrl = import.meta.env.VITE_CLOUD_FUNCTION_URL;

async function isBooked(slotId) {
  const q = query(
    collection(db, "bookings"),
    where("slotId", "==", slotId),
    where("userId", "==", currentUser.value.uid),
    limit(1)
  );
  return getDocs(q)
    .then((snap) => {
      return !snap.empty;
    })
    .catch(() => {
      console.error("Error checking booking status");
      return false;
    });
}

async function addBooking(slotId) {
  const idToken = await currentUser.value?.getIdToken();
  if (!idToken) {
    return Promise.reject(new Error("User not authenticated"));
  }
  return axios.post(
    `${functionUrl}/bookings/add`,
    {
      slotId
    },
    {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    }
  );
}

async function deleteBooking(slotId) {
  const q = query(
    collection(db, "bookings"),
    where("slotId", "==", slotId),
    where("userId", "==", currentUser.value.uid),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) {
    return Promise.reject(new Error("Booking not found"));
  }
  const docId = snap.docs[0].id;
  return deleteDoc(doc(db, "bookings", docId));
}

export { isBooked, addBooking, deleteBooking };
