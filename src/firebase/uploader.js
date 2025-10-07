import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/firebase/init";

async function uploadImage(file) {
  const ext = file.name.split(".").pop();
  const uniqueName = `${crypto.randomUUID()}.${ext}`;

  const path = `images/${uniqueName}`;
  const fileRef = storageRef(storage, path);

  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  return { url, path };
}

async function deleteImage(path) {
  if (!path) return;
  const fileRef = storageRef(storage, path);
  await deleteObject(fileRef);
}

export { uploadImage, deleteImage };
