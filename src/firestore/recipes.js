import {
  doc,
  query,
  getDocs,
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
import { uploadImage, deleteImage } from "@/firebase/uploader";

const generateRecipesQueryByFilters = (filters) => {
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
  // Upload image if exists
  if (imageFile) {
    const { url, path } = await uploadImage(imageFile);
    recipe.imageUrl = url;
    recipe.imagePath = path;
  }
  recipe.createdBy = currentUser.value?.uid || null;
  recipe.createdAt = serverTimestamp();
  // Add the recipe document
  return addDoc(collection(db, "recipes"), recipe);
}

async function updateRecipe(recipe, imageFile) {
  // Delete old image
  if (!recipe.imageUrl && recipe.imagePath) {
    deleteImage(recipe.imagePath);
    recipe.imagePath = null;
  }
  // Upload new image if exists
  if (imageFile) {
    const { url, path } = await uploadImage(imageFile);
    recipe.imageUrl = url;
    recipe.imagePath = path;
  }
  // Update the recipe document
  return setDoc(
    doc(db, "recipes", recipe.id),
    {
      name: recipe.name,
      summary: recipe.summary,
      details: recipe.details,
      imageUrl: recipe.imageUrl || null,
      imagePath: recipe.imagePath || null
    },
    { merge: true }
  );
}

async function deleteRecipe(recipe) {
  // Delete associated image if exists
  if (recipe.imagePath) {
    deleteImage(recipe.imagePath);
  }
  // Delete the recipe document
  await deleteDoc(doc(db, "recipes", recipe.id));

  const qAll = query(
    collection(db, "ratings"),
    where("recipeId", "==", recipe.id)
  );
  const snap = await getDocs(qAll);
  return Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

export {
  generateRecipesQueryByFilters,
  addRecipe,
  updateRecipe,
  deleteRecipe
};
