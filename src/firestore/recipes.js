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
import { clearAllRatings } from "@/firestore/ratings";
import { updateImage } from "@/firestore/utils";

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
  let promises = [];
  // Delete associated image if exists
  if (recipe.imagePath) {
    promises.push(updateImage(recipe.imagePath, null));
  }
  // Clear all ratings associated with this recipe
  promises.push(clearAllRatings(recipe.id));
  // Delete the recipe document
  promises.push(deleteDoc(doc(db, "recipes", recipe.id)));
  return Promise.all(promises);
}

export { addRecipe, updateRecipe, deleteRecipe };
