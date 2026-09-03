const { ApiError } = require("../utils");

const handleGlobalError = (err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    console.error(err?.message || err);
    return res.status(500).json({ error: "Internal server error" });
}

module.exports = { handleGlobalError };
