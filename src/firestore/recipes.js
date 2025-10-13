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
import { clearAllRatings } from "@/firestore/ratings";
import { updateImage } from "@/firestore/utils";

function generateRecipesQueryByFilters(filters) {
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

async function addRecipe(recipe, imageFile) {
  const { id: _, ...data } = recipe; // Exclude id from data
  // Upload image if exists
  if (imageFile) {
    const { imageUrl, imagePath } = await updateImage(null, imageFile);
    data.imageUrl = imageUrl;
    data.imagePath = imagePath;
  }
  data.createdBy = currentUser.value?.uid || null;
  data.createdAt = serverTimestamp();
  // Add the recipe document
  return addDoc(collection(db, "recipes"), data);
}

function updateRecipe(id, updatedFields) {
  const { id: _, ...data } = updatedFields; // Exclude id from data
  return setDoc(doc(db, "recipes", id), data, { merge: true });
}

async function deleteRecipe(recipe) {
  // Delete associated image if exists
  if (recipe.imagePath) {
    await updateImage(recipe.imagePath, null);
  }
  // Delete the recipe document
  await deleteDoc(doc(db, "recipes", recipe.id));

  // Clear all ratings associated with this recipe
  return clearAllRatings(recipe.id);
}

export {
  generateRecipesQueryByFilters,
  addRecipe,
  updateRecipe,
  deleteRecipe
};
