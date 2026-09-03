const { env } = require("../config");
const { ApiError, verifyToken, generateCsrfHmacHash } = require("../utils");

const csrfProtection = (req, res, next) => {
  const csrfToken = req.headers["x-csrf-token"];
  const accessToken = req.cookies.accessToken;

  if (!csrfToken || typeof csrfToken !== "string") {
    return res.status(400).json({ error: "Invalid csrf token" });
  }

  const decodedAccessToken = verifyToken(
    accessToken,
    env.JWT_ACCESS_TOKEN_SECRET
  );
  if (!decodedAccessToken || !decodedAccessToken.csrf_hmac) {
    return res.status(400).json({ error: "Invalid csrf token" });
  }

  const hmacHashedCsrf = generateCsrfHmacHash(csrfToken);
  if (decodedAccessToken.csrf_hmac !== hmacHashedCsrf) {
    return res.status(403).json({ error: "Forbidden. CSRF token mismatch" });
  }

  next();
};

module.exports = { csrfProtection };
