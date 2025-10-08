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
import { db, currentUser } from "@/firebase/init";

async function getRating(recipeId) {
  const result = {
    count: 0,
    avg: 0,
    myRating: 0
  };

  // get all ratings for this recipe
  const qAll = query(
    collection(db, "ratings"),
    where("recipeId", "==", recipeId)
  );

  const snap = await getAggregateFromServer(qAll, {
    avg: average("value"),
    count: count()
  });

  result.count = snap.data().count || 0;
  result.avg = snap.data().avg || 0;

  // my own rating
  if (currentUser.value) {
    const qMine = query(
      collection(db, "ratings"),
      where("recipeId", "==", recipeId),
      where("userId", "==", currentUser.value.uid),
      limit(1)
    );
    const mineSnap = await getDocs(qMine);
    if (!mineSnap.empty) {
      const val = Number(mineSnap.docs[0].data().value || 0);
      result.myRating = val;
    }
  }

  return result;
}

async function setRating(recipeId, value) {
  if (!currentUser.value) throw new Error("User not logged in");
  const docId = `${recipeId}_${currentUser.value.uid}`;
  return setDoc(
    doc(db, "ratings", docId),
    {
      recipeId: recipeId,
      userId: currentUser.value.uid,
      value: value,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

async function clearRating(recipeId) {
  if (!currentUser.value) throw new Error("User not logged in");
  const docId = `${recipeId}_${currentUser.value.uid}`;
  return deleteDoc(doc(db, "ratings", docId));
}

export { getRating, setRating, clearRating };
