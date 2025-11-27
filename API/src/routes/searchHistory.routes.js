// src/routes/searchHistory.routes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/searchHistory.controller");
const auth = require("../middleware/auth.middleware");

// Todas protegidas por JWT
router.post("/", auth, controller.crearHistorial);
router.get("/", auth, controller.listarHistorial);
router.get("/:id", auth, controller.verHistorial);

module.exports = router;
