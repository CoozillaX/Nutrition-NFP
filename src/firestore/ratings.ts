import {
  collection,
  query,
  limit,
  getDocs,
  doc,
  deleteDoc,
  where,
  setDoc,
  serverTimestamp,
  getAggregateFromServer,
  count,
  average
} from "firebase/firestore";
import { db } from "@/firebase/storage";
import { currentUser } from "@/firebase/auth";

import type { CollectionReference } from "firebase/firestore";

const collectionName = "ratings";

/**
 * Get rating statistics for a recipe
 * @param recipeId The ID of the recipe
 * @returns An object containing count, average rating, and user's rating
 */
async function getRating(recipeId: string): Promise<{
  count: number;
  avg: number;
  myRating: number;
}> {
  const result = {
    count: 0,
    avg: 0,
    myRating: 0
  };

  // get all ratings for this recipe
  const qAll = query(
    collection(db, collectionName) as CollectionReference<
      RatingEntity,
      RatingEntity
    >,
    where("recipeId", "==", recipeId)
  );

  // aggregate count and average
  const snap = await getAggregateFromServer(qAll, {
    count: count(),
    avg: average("value")
  });
  result.count = snap.data().count || 0;
  result.avg = snap.data().avg || 0;

  // my own rating
  if (currentUser.value) {
    const qMine = query(
      collection(db, collectionName) as CollectionReference<
        RatingEntity,
        RatingEntity
      >,
      where("recipeId", "==", recipeId),
      where("userId", "==", currentUser.value.uid),
      limit(1)
    );
    const mineSnap = await getDocs(qMine);
    if (!mineSnap.empty) {
      result.myRating = mineSnap.docs[0].data().value || 0;
    }
  }
  return result;
}

/**
 * Set or update rating for a recipe by the current user
 * @param recipeId The ID of the recipe
 * @param value The rating value
 * @returns A promise that resolves when the rating is set
 */
async function setRating(recipeId: string, value: number): Promise<void> {
  // must be logged in
  if (!currentUser.value) throw new Error("User not logged in");
  // use composite key of recipeId_userId
  const docId = `${recipeId}_${currentUser.value.uid}`;
  // prepare data
  const updatedFields: Partial<RatingEntity> = {
    recipeId: recipeId,
    userId: currentUser.value.uid,
    value: value,
    updatedAt: serverTimestamp()
  };
  // set document
  await setDoc(doc(db, collectionName, docId), updatedFields, { merge: true });
}

/**
 * Clear rating for a recipe by the current user
 * @param recipeId The ID of the recipe
 * @returns A promise that resolves when the rating is cleared
 */
async function clearRating(recipeId: string): Promise<void> {
  // must be logged in
  if (!currentUser.value) throw new Error("User not logged in");
  // delete document
  const docId = `${recipeId}_${currentUser.value.uid}`;
  await deleteDoc(doc(db, collectionName, docId));
}

/**
 * Clear all ratings for a specific recipe
 * @param recipeId The ID of the recipe
 * @returns A promise that resolves when all ratings are cleared
 */
async function clearAllRatings(recipeId: string): Promise<void> {
  const qAll = query(
    collection(db, collectionName) as CollectionReference<
      RatingEntity,
      RatingEntity
    >,
    where("recipeId", "==", recipeId)
  );
  const snap = await getDocs(qAll);
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

export { getRating, setRating, clearRating, clearAllRatings };
