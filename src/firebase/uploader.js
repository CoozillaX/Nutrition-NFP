import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/firebase/init";

async function uploadImage(file) {
  const fileRef = storageRef(storage, `images/${file.name}`);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}

export { uploadImage };
