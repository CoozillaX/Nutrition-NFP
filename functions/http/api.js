const express = require("express");
const cors = require("cors");
const auth = require("../middleware/auth");

const api = express();
api.use(cors({ origin: true }));
api.use(express.json());

// Public routes
api.use("/planner", require("./planner"));

// Protected routes
api.use("/bookings", auth, require("./bookings"));

module.exports = api;
