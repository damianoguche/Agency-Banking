import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      console.error("Token expired");
      return null;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      console.error("Invalid token");
      return null;
    }

    console.error("Token verification failed:", err);
    return null;
  }
}
