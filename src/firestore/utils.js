import {
  query,
  limit,
  startAfter,
  getDocs,
  getCountFromServer
} from "firebase/firestore";
import { uploadImage, deleteImage } from "@/firebase/uploader";

async function getCursorForPage(pageNum, baseQuery, countPerRow, cursors) {
  // If we already have the cursor for the target page, return it
  if (cursors[pageNum - 1]) return cursors[pageNum - 1];

  // Find the last known cursor before the target page
  let lastKnownPage = -1;
  for (let i = pageNum - 1; i >= 0; i--) {
    if (cursors[i]) {
      lastKnownPage = i;
      break;
    }
  }

  // Start querying from the last known cursor
  let q = query(baseQuery, limit(countPerRow));
  let snap;

  if (lastKnownPage >= 0) {
    q = query(
      baseQuery,
      startAfter(cursors[lastKnownPage]),
      limit(countPerRow)
    );
  }

  // Fetch pages until we reach the target page
  for (let i = lastKnownPage + 1; i < pageNum; i++) {
    snap = await getDocs(q);
    if (snap.empty) return null;
    cursors[i] = snap.docs[snap.docs.length - 1];

    q = query(baseQuery, startAfter(cursors[i]), limit(countPerRow));
  }

  return cursors[pageNum - 1];
}

async function fetchByPage(pageNum, baseQuery, countPerRow, cursors) {
  const cursor = await getCursorForPage(
    pageNum,
    baseQuery,
    countPerRow,
    cursors
  );

  let q = query(baseQuery, limit(countPerRow));
  if (cursor) q = query(baseQuery, startAfter(cursor), limit(countPerRow));

  const snap = await getDocs(q);
  const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  if (snap.docs.length > 0) {
    cursors[pageNum] = snap.docs[snap.docs.length - 1];
  }

  return {
    data,
    cursors
  };
}

async function getTotalCount(currQuery) {
  const snapCount = await getCountFromServer(currQuery);
  return snapCount.data().count || 0;
}

async function updateImage(currentImagePath, imageFile) {
  let updatedFields = {
    imageUrl: null,
    imagePath: null
  };

  // Delete old image
  if (currentImagePath) {
    deleteImage(currentImagePath);
  }

  // Upload new image if exists
  if (imageFile) {
    const { url, path } = await uploadImage(imageFile);
    updatedFields.imageUrl = url;
    updatedFields.imagePath = path;
  }

  // Update the recipe document
  return updatedFields;
}

export {
  getCursorForPage,
  fetchByPage,
  getTotalCount,
  updateImage
};
