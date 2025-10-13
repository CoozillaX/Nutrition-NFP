import {
  doc,
  query,
  deleteDoc,
  collection,
  orderBy,
  where,
  serverTimestamp,
  addDoc,
  setDoc
} from "firebase/firestore";
import { FilterMatchMode } from "@primevue/core/api";
import { db, currentUser } from "@/firebase/init";
import { updateImage } from "@/firestore/utils";

const generateCoursesQueryByFilters = (filters) => {
  let newQuery = query(collection(db, "recipes"), orderBy("createdAt"));
  if (!filters) return newQuery;

  // CreatedAt filter
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
  // Name filter
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
  // Summary filter
  const { value: summaryValue, matchMode: summaryMode } = filters.summary || {};
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
  return newQuery;
};

async function addCourse(course, imageFile) {
  // Upload image if exists
  if (imageFile) {
    const { imageUrl, imagePath } = await updateImage(null, imageFile);
    course.imageUrl = imageUrl;
    course.imagePath = imagePath;
  }
  course.createdBy = currentUser.value?.uid || null;
  course.createdAt = serverTimestamp();
  // Add the recipe document
  return addDoc(collection(db, "courses"), course);
}

async function updateCourse(id, updatedFields) {
  const { id: _, ...data } = updatedFields; // Exclude id from data
  return setDoc(doc(db, "courses", id), data, { merge: true });
}

async function deleteCourse(course) {
  // Delete associated image if exists
  if (course.imagePath) {
    await updateImage(course.imagePath, null);
  }
  // Delete the recipe document
  return deleteDoc(doc(db, "courses", course.id));
  // TODO: Clear all time slots associated with this course
}

export { generateCoursesQueryByFilters, addCourse, updateCourse, deleteCourse };
