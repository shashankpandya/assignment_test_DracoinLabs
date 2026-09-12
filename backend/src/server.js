const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { app } = require("./app.js");
const { env } = require("./config");

const PORT = env.PORT || 5007;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on("request", (req, res) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
});
