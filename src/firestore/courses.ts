import {
  doc,
  deleteDoc,
  collection,
  serverTimestamp,
  addDoc,
  setDoc
} from "firebase/firestore";
import { db } from "@/firebase/storage";
import { currentUser } from "@/firebase/auth";
import { updateImage } from "@/firestore/utils";
import { deleteAllCourseSlotsByCourseId } from "@/firestore/courseSlots";

const collectionName = "courses";

/**
 * Course entity interface
 * @param course The course entity
 * @param imageFile The image file to upload
 * @return The ID of the newly created course
 */
async function addCourse(
  course: Partial<CourseEntity>,
  imageFile: File | null
): Promise<string> {
  // Exclude id from data
  const { id: _, ...rest } = course;
  // Upload image if exists
  if (imageFile) {
    const { imageUrl, imagePath } = await updateImage(null, imageFile);
    rest.imageUrl = imageUrl;
    rest.imagePath = imagePath;
  }
  rest.createdBy = currentUser.value?.uid || null;
  rest.createdAt = serverTimestamp();
  // Add the recipe document
  try {
    const ref = await addDoc(collection(db, collectionName), rest);
    return ref.id;
  } catch (error) {
    Promise.reject(error);
  }
}

/**
 * Update an existing course
 * @param id The ID of the course to update
 * @param updatedFields The fields to update
 * @return A promise that resolves when the course is updated
 */
function updateCourse(
  id: string,
  updatedFields: Partial<CourseEntity>
): Promise<void> {
  // Exclude id from data
  const { id: _, ...data } = updatedFields;
  return setDoc(doc(db, collectionName, id), data, { merge: true });
}

/**
 * Delete a course and its associated data
 * @param course The course entity to delete
 * @return A promise that resolves when the course and its associated data are deleted
 */
async function deleteCourse(course: CourseEntity): Promise<any[]> {
  const promises: Promise<any>[] = [];
  // Delete associated image if exists
  if (course.imagePath) {
    promises.push(updateImage(course.imagePath, null));
  }
  // Clear all time slots associated with this course
  promises.push(deleteAllCourseSlotsByCourseId(course.id));
  // Delete the recipe document
  promises.push(deleteDoc(doc(db, collectionName, course.id)));
  return Promise.all(promises);
}

export { addCourse, updateCourse, deleteCourse };
