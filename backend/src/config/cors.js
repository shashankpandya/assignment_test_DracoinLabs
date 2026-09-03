const cors = require("cors");
const { env } = require("./env");

const allowedOrigins = [env.UI_URL, "http://localhost:5173", "http://127.0.0.1:5173"].filter(Boolean);

const corsPolicy = cors({
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  credentials: true,
});

module.exports = { corsPolicy };
