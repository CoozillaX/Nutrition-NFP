import admin from "firebase-admin";
import { Request, Response, NextFunction } from "express";

/**
 * Middleware to authenticate requests using Firebase ID tokens.
 * @param req Express request object
 * @param res Express response object
 * @param next Next function to pass control to the next middleware
 */
async function auth(req: Request, res: Response, next: NextFunction) {
  try {
    // Check for the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid token" });
    }
    // Verify the ID token
    const idToken = authHeader.split("Bearer ")[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    // Check if the email is verified
    if (!decoded.email_verified) {
      return res.status(403).json({ error: "Email not verified" });
    }
    // Attach user info to the request object
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export {
  auth,
}
