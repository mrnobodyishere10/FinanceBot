const express = require("express");
const router = express.Router();
router.get("/", (req, res) => res.json({ message: "analytics route working" }));
module.exports = router;
