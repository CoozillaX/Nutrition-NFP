const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { sign, verify } = require("../utils/crypto");

const { logger } = require("firebase-functions");

const db = getFirestore(admin.app(), "fit5032-assessments-database");
const courseCollection = db.collection("courses");
const recipeCollection = db.collection("recipes");

const openapi = express();
openapi.use(express.json());
openapi.use(cors());

const _requesthandler = async (req, res, collectionName) => {
  const { cursor: signed, limit } = req.body;
  let createdAt, id;
  // verify limit
  if (!limit || !Number.isInteger(limit) || limit <= 0 || limit > 50) {
    return res
      .status(400)
      .json({ error: "Invalid limit, must be between 1 and 50" });
  }
  // parse cursor
  if (signed) {
    try {
      const encoded = verify(signed);
      const decoded = Buffer.from(encoded, "base64").toString("utf-8");
      const parsed = JSON.parse(decoded);
      if (parsed.collection !== collectionName) {
        return res.status(400).json({ error: "Invalid cursor" });
      }
      createdAt = new Timestamp(
        parsed.createdAt._seconds,
        parsed.createdAt._nanoseconds
      );
      id = parsed.id;
    } catch (e) {
      return res.status(400).json({ error: "Invalid cursor" });
    }
  }
  // build query
  let query = null;
  switch (collectionName) {
    case "courses":
      query = courseCollection;
      break;
    case "recipes":
      query = recipeCollection;
      break;
    default:
      // should never reach here
      return res.status(400).json({ error: "Invalid collection" });
  }
  query = query.orderBy("createdAt").orderBy("__name__").limit(limit);
  if (createdAt && id) {
    query = query.startAfter(createdAt, id);
  }
  // execute query
  try {
    const snap = await query.get();
    // build response
    const data = [];
    snap.forEach((doc) => {
      const d = doc.data();
      d.id = doc.id;
      data.push({
        name: d.name,
        summary: d.summary,
        details: d.details,
        imageUrl: d.imageUrl
      });
    });
    // build next cursor
    let nextCursor = null;
    if (snap.size === limit) {
      const lastDoc = snap.docs[snap.docs.length - 1];
      const encoded = Buffer.from(
        JSON.stringify({
          collection: collectionName,
          createdAt: lastDoc.get("createdAt"),
          id: lastDoc.id
        })
      ).toString("base64");
      nextCursor = sign(encoded);
    }
    return res.json({ data, nextCursor });
  } catch (error) {
    logger.error("Error querying:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Query courses
openapi.post("/courses/query", (req, res) => {
  return _requesthandler(req, res, "courses");
});

// Query recipes
openapi.post("/recipes/query", (req, res) => {
  return _requesthandler(req, res, "recipes");
});

module.exports = openapi;
