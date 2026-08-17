import jwt from "jsonwebtoken";

export function requireJwt(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Authentication required" });

  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireSameEmail(req, res, next) {
  const tokenEmail = String(req.auth?.email || "").toLowerCase();
  const routeEmail = String(req.params.email || "").toLowerCase();
  if (!tokenEmail || tokenEmail !== routeEmail) {
    return res.status(403).json({ message: "Forbidden: account mismatch" });
  }
  next();
}
