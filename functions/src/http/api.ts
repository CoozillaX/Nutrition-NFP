import express from "express";
import cors from "cors";
import { auth } from "../middleware/auth";
import { plannerRouter } from "./planner";
import { bookingsRouter } from "./bookings";

const api = express();

// Middleware
api.use(cors({ origin: true }));
api.use(express.json());

// Public routes
api.use("/planner", plannerRouter);

// Protected routes
api.use("/bookings", auth, bookingsRouter);

export { api };
