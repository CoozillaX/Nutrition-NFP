const admin = require("firebase-admin");

async function auth(req, res, next) {
  try {
    // Check for the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid token" });
    }
    // Verify the ID token
    const idToken = authHeader.split("Bearer ")[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    // If email not verified
    if (!decoded.email_verified) {
      return res.status(403).json({ error: "Email not verified" });
    }
    // Attach the decoded token to the request object
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

module.exports = auth;
