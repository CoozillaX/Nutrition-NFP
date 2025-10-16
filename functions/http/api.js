// functions/http/api.js
const express = require("express");
const functions = require("firebase-functions");
const cors = require("cors");
const auth = require("../middleware/auth");

const api = express();
api.use(cors({ origin: true }));
api.use(express.json());

// Protected routes
api.use("/bookings", auth, require("./bookings"));

module.exports = api;
