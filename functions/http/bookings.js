const express = require("express");
const admin = require("firebase-admin");
const { getFirestore } = require('firebase-admin/firestore');
const { sendConfirmationEmail } = require("../utils/email");

const bookingsRouter = express.Router();

admin.initializeApp();
const db = getFirestore(admin.app(), "nutrition-nfp-db");
const courseCollection = db.collection("courses");
const slotCollection = db.collection("courseSlots");
const bookingCollection = db.collection("bookings");

// Add Booking
bookingsRouter.get("/add", async (req, res) => {
  const uid = req.user.uid;
  const email = req.user.email;

  // Parsing slotId from request body
  const slotId = req.query.slotId;
  if (!slotId) {
    return res.status(400).send("slotId is required");
  }

  // Get target slot
  const targetSlotSnap = await slotCollection.doc(slotId).get();
  if (!targetSlotSnap.exists) {
    return res.status(404).send("Slot not found");
  }
  const { start, end, capacity, courseId } = targetSlotSnap.data();

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
    // Get all slot
    const prevSlotIds = userBookingsSnap.docs.map((d) => d.data().slotId);
    const prevSlotSnaps = await db.getAll(
      ...prevSlotIds.map((id) => slotCollection.doc(id))
    );
    // Check time conflict
    for (const snap of prevSlotSnaps) {
      if (!snap.exists) continue;
      const { start: prevStart, end: prevEnd } = snap.data();
      if (
        start.toMillis() < prevEnd.toMillis() &&
        end.toMillis() > prevStart.toMillis()
      ) {
        return res.status(400).send("Time conflict with existing booking");
      }
    }
  }

  // Add booking
  const newBooking = {
    userId: uid,
    slotId: slotId,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };
  await bookingCollection.add(newBooking);

  // Send email
  const { name: courseName, location } = targetCourseSnap.data();
  sendConfirmationEmail(email, courseName, start, end, location) // async, not await
  res.status(201).send("Booking successful");
});

module.exports = bookingsRouter;
