// functions/src/http/bookings.ts
import express, { Request, Response } from "express";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { sendConfirmationEmail } from "../utils/email";

type AuthedUser = {
  uid: string;
  email: string;
};

// avoid re-initializing app
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize Firestore
const db = getFirestore(admin.app(), "nutrition-nfp-db");
const courseCollection = db.collection("courses");
const slotCollection = db.collection("courseSlots");
const bookingCollection = db.collection("bookings");

const bookingsRouter = express.Router();

// Add Booking
bookingsRouter.get("/add", async (req: Request, res: Response) => {
  const user = (req as any).user as AuthedUser | undefined;

  const uid = user?.uid;
  const email = user?.email;

  if (!uid || !email) {
    return res.status(401).send("Unauthorized");
  }

  // Parsing slotId from request query
  const slotId = req.query.slotId as string | undefined;
  if (!slotId) {
    return res.status(400).send("slotId is required");
  }

  // Get target slot
  const targetSlotSnap = await slotCollection.doc(slotId).get();
  if (!targetSlotSnap.exists) {
    return res.status(404).send("Slot not found");
  }

  const {
    start,
    end,
    capacity,
    courseId,
  } = targetSlotSnap.data() as {
    start: FirebaseFirestore.Timestamp;
    end: FirebaseFirestore.Timestamp;
    capacity: number;
    courseId: string;
  };

  // Get target course
  const targetCourseSnap = await courseCollection.doc(courseId).get();
  if (!targetCourseSnap.exists) {
    return res.status(404).send("Course not found");
  }

  // Capacity check (current slot)
  const currBookingSnap = await bookingCollection
    .where("slotId", "==", slotId)
    .get();

  if (currBookingSnap.size >= capacity) {
    return res.status(400).send("Slot is fully booked");
  }

  // Time conflict check (cross course)
  const userBookingsSnap = await bookingCollection
    .where("userId", "==", uid)
    .get();

  if (!userBookingsSnap.empty) {
    const prevSlotIds = userBookingsSnap.docs.map((d) => d.data().slotId);
    const prevSlotSnaps = await db.getAll(
      ...prevSlotIds.map((id) => slotCollection.doc(id))
    );

    for (const snap of prevSlotSnaps) {
      if (!snap.exists) continue;
      const { start: prevStart, end: prevEnd } =
        snap.data() as {
          start: FirebaseFirestore.Timestamp;
          end: FirebaseFirestore.Timestamp;
        };

      // Check for time overlap
      if (
        start.toMillis() < prevEnd.toMillis() &&
        end.toMillis() > prevStart.toMillis()
      ) {
        return res
          .status(400)
          .send("Time conflict with existing booking");
      }
    }
  }

  // Add booking
  const newBooking = {
    userId: uid,
    slotId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await bookingCollection.add(newBooking);

  // Send email
  const { name: courseName, location } = targetCourseSnap.data() as {
    name: string;
    location: number[] | null;
  };

  void sendConfirmationEmail(email, courseName, start, end, location);

  res.status(201).send("Booking successful");
});

export { bookingsRouter };
