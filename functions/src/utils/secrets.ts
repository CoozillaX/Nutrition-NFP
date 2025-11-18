import { defineSecret } from "firebase-functions/params";

// Define secrets
export const SENDGRID_API_KEY = defineSecret("SENDGRID_API_KEY");
export const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
