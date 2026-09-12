const jwt = require("jsonwebtoken");
const { ApiError } = require("../utils");
const { env } = require("../config");

const authenticateToken = (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  if (!accessToken || !refreshToken) {
    throw new ApiError(401, "Unauthorized. Please provide valid tokens.");
  }

  try {
    const user = jwt.verify(accessToken, env.JWT_ACCESS_TOKEN_SECRET);
    const decodedRefreshToken = jwt.verify(refreshToken, env.JWT_REFRESH_TOKEN_SECRET);

    req.user = user;
    req.refreshToken = decodedRefreshToken;
    return next();
  } catch (error) {
    const message = error?.name === "TokenExpiredError"
      ? "Unauthorized. Token expired."
      : "Unauthorized. Please provide valid tokens.";
    throw new ApiError(401, message);
  }
};

module.exports = { authenticateToken };
