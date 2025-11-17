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
import { uploadImage, deleteImage } from "@/firebase/storage";

const collectionName = "recipes";

/**
 * Add a new recipe
 * @param recipe The recipe entity to add
 * @param imageFile Optional image file to upload
 * @returns The ID of the newly created recipe
 */
async function addRecipe(
  recipe: Partial<RecipeEntity>,
  imageFile?: File | null
): Promise<string> {
  const { id: _, ...data } = recipe; // Exclude id from data
  // Upload image if exists
  if (imageFile) {
    const { url, path } = await uploadImage(imageFile);
    data.imageUrl = url;
    data.imagePath = path;
  }
  data.createdBy = currentUser.value?.uid;
  data.createdAt = serverTimestamp();
  // Add the recipe document
  return (await addDoc(collection(db, collectionName), data)).id;
}

/**
 * Update an existing recipe
 * @param id The ID of the recipe to update
 * @param updatedFields The fields to update
 */
async function updateRecipe(
  id: string,
  updatedFields: Partial<RecipeEntity>
): Promise<void> {
  const { id: _, ...data } = updatedFields; // Exclude id from data
  await setDoc(doc(db, collectionName, id), data, { merge: true });
}

/**
 * Delete a recipe and its associated data
 * @param recipe The recipe entity to delete
 */
async function deleteRecipe(recipe: RecipeEntity): Promise<void> {
  const promises = [];
  // Delete associated image if exists
  if (recipe.imagePath) {
    promises.push(deleteImage(recipe.imagePath));
  }
  // Clear all ratings associated with this recipe
  promises.push(clearAllRatings(recipe.id));
  // Delete the recipe document
  promises.push(deleteDoc(doc(db, collectionName, recipe.id)));
  await Promise.all(promises);
}

export { addRecipe, updateRecipe, deleteRecipe };
