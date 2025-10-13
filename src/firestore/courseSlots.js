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
import { db, currentUser } from "@/firebase/init";

function generateCourseSlotsQueryByFilters(filters) {
  let newQuery = query(collection(db, "courseSlots"));
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

async function addCourseSlot(courseSlot) {
  // check if slot overlaps with existing slots for the same course
  const overlappingQuery = query(
    collection(db, "courseSlots"),
    where("courseId", "==", courseSlot.courseId),
    where("start", "<", courseSlot.end),
    where("end", ">", courseSlot.start)
  );
  return getDocs(overlappingQuery).then((querySnapshot) => {
    if (!querySnapshot.empty) {
      return Promise.reject(
        new Error("The course slot overlaps with existing slots.")
      );
    }
    const { id: _, ...data } = courseSlot; // Exclude id from data
    data.createdAt = serverTimestamp();
    data.createdBy = currentUser.value.uid;
    return addDoc(collection(db, "courseSlots"), data);
  });
}

function updateCourseSlot(id, updatedFields) {
  const { id: _, ...data } = updatedFields; // Exclude id from data
  return setDoc(doc(db, "courseSlots", id), data, { merge: true });
}

function deleteCourseSlot(courseSlot) {
  return deleteDoc(doc(db, "courseSlots", courseSlot.id));
}

function deleteAllCourseSlotsByCourseId(courseId) {
  const courseSlotsQuery = query(
    collection(db, "courseSlots"),
    where("courseId", "==", courseId)
  );
  return getDocs(courseSlotsQuery).then((querySnapshot) => {
    const deletePromises = [];
    querySnapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });
    return Promise.all(deletePromises);
  });
}

export {
  generateCourseSlotsQueryByFilters,
  addCourseSlot,
  updateCourseSlot,
  deleteCourseSlot,
  deleteAllCourseSlotsByCourseId
};
