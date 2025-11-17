import {
  doc,
  query,
  deleteDoc,
  collection,
  where,
  serverTimestamp,
  getDocs,
  addDoc,
  setDoc
} from "firebase/firestore";
import { db } from "@/firebase/storage";
import { currentUser } from "@/firebase/auth";

import type { DataTableFilterEvent } from "primevue/datatable";
import type { Query, CollectionReference } from "firebase/firestore";

const collectionName = "courseSlots";

/**
 * Generate a Firestore query based on DataTable filters for course slots
 * @param filters The DataTable filters
 * @returns A Firestore query
 */
function generateCourseSlotsQueryByFilters(
  filters: DataTableFilterEvent["filters"]
): Query<CourseSlotEntity, CourseSlotEntity> {
  let newQuery = query(
    collection(db, collectionName) as CollectionReference<
      CourseSlotEntity,
      CourseSlotEntity
    >
  );
  if (!filters) return newQuery;
  // courseId
  const courseId = filters.courseId;
  if (courseId) {
    newQuery = query(newQuery, where("courseId", "==", courseId));
  }
  // start
  const startDate = filters.start;
  if (startDate) {
    newQuery = query(newQuery, where("start", ">=", startDate));
  }
  // end
  const endDate = filters.end;
  if (endDate) {
    newQuery = query(newQuery, where("end", "<=", endDate));
  }
  return newQuery;
}

/**
 * Add a new course slot
 * @param courseSlot The course slot entity to add
 * @returns The ID of the newly created course slot
 */
async function addCourseSlot(
  courseSlot: Partial<CourseSlotEntity>
): Promise<string> {
  // check if slot overlaps with existing slots for the same course
  const overlappingQuery = query(
    collection(db, collectionName),
    where("courseId", "==", courseSlot.courseId),
    where("start", "<", courseSlot.end),
    where("end", ">", courseSlot.start)
  );
  // Check for overlapping slots
  const querySnapshot = await getDocs(overlappingQuery);
  if (!querySnapshot.empty)
    throw new Error("The course slot overlaps with existing slots.");
  // Add the new course slot
  const { id: _, ...data } = courseSlot; // Exclude id from data
  data.createdAt = serverTimestamp();
  data.createdBy = currentUser.value?.uid;
  return (await addDoc(collection(db, collectionName), data)).id;
}

/**
 * Update an existing course slot
 * @param id The ID of the course slot to update
 * @param updatedFields The fields to update
 * @returns A promise that resolves when the course slot is updated
 */
function updateCourseSlot(
  id: string,
  updatedFields: Partial<CourseSlotEntity>
): Promise<void> {
  const { id: _, ...data } = updatedFields; // Exclude id from data
  return setDoc(doc(db, collectionName, id), data, { merge: true });
}

/**
 * Delete a course slot
 * @param courseSlot The course slot to delete
 * @returns A promise that resolves when the course slot is deleted
 */
function deleteCourseSlot(courseSlot: CourseSlotEntity): Promise<void> {
  return deleteDoc(doc(db, collectionName, courseSlot.id));
}

/**
 * Delete all course slots associated with a specific course ID
 * @param courseId The ID of the course whose slots are to be deleted
 * @returns A promise that resolves when all associated course slots are deleted
 */
async function deleteAllCourseSlotsByCourseId(courseId: string): Promise<void> {
  const courseSlotsQuery = query(
    collection(db, collectionName),
    where("courseId", "==", courseId)
  );
  const snapshot = await getDocs(courseSlotsQuery);
  const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
}

export {
  generateCourseSlotsQueryByFilters,
  addCourseSlot,
  updateCourseSlot,
  deleteCourseSlot,
  deleteAllCourseSlotsByCourseId
};
