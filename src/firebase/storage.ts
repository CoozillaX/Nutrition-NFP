import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { app } from "@/firebase/init";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "firebase/storage";

const db = getFirestore(app, import.meta.env.VITE_FIREBASE_STORAGE_NAME);
const storage = getStorage();

/**
 * Upload an image to Firebase Storage.
 * @param file - The image file to upload.
 * @returns A promise that resolves with the download URL and storage path of the uploaded image.
 */
async function uploadImage(file: File): Promise<{ url: string; path: string }> {
  const ext = file.name.split(".").pop();
  const uniqueName = `${crypto.randomUUID()}.${ext}`;
  const path = `images/${uniqueName}`;
  const fileRef = storageRef(storage, path);
  // Upload file first
  await uploadBytes(fileRef, file);
  // Get download URL
  const url = await getDownloadURL(fileRef);
  return { url, path };
}

/**
 * Delete an image from Firebase Storage.
 * @param path - The storage path of the image to delete.
 * @returns A promise that resolves when the image is deleted.
 */
function deleteImage(path: string): Promise<void> {
  const fileRef = storageRef(storage, path);
  return deleteObject(fileRef);
}

export { db, uploadImage, deleteImage };
