const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Unauthorized: No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Set userId to request
    req.userId = decoded.userId;

    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid token" });
  }
};
