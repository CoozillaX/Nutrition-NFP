import {
  doc,
  deleteDoc,
  collection,
  serverTimestamp,
  addDoc,
  setDoc
} from "firebase/firestore";
import { db, currentUser } from "@/firebase/init";
import { updateImage } from "@/firestore/utils";
import { deleteAllCourseSlotsByCourseId } from "@/firestore/courseSlots";

async function addCourse(course, imageFile) {
  const { id: _, ...data } = course; // Exclude id from data
  // Upload image if exists
  if (imageFile) {
    const { imageUrl, imagePath } = await updateImage(null, imageFile);
    data.imageUrl = imageUrl;
    data.imagePath = imagePath;
  }
  data.createdBy = currentUser.value?.uid || null;
  data.createdAt = serverTimestamp();
  // Add the recipe document
  return addDoc(collection(db, "courses"), data);
}

function updateCourse(id, updatedFields) {
  const { id: _, ...data } = updatedFields; // Exclude id from data
  return setDoc(doc(db, "courses", id), data, { merge: true });
}

async function deleteCourse(course) {
  let promises = [];
  // Delete associated image if exists
  if (course.imagePath) {
    promises.push(updateImage(course.imagePath, null));
  }
  // Clear all time slots associated with this course
  promises.push(deleteAllCourseSlotsByCourseId(course.id));
  // Delete the recipe document
  promises.push(deleteDoc(doc(db, "courses", course.id)));
  return Promise.all(promises);
}

export { addCourse, updateCourse, deleteCourse };
