// src/middlewares/uploadCsv.js
const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.originalname.endsWith(".csv")) {
      return cb(new Error("El archivo debe ser un CSV válido."));
    }
    cb(null, true);
  }
});

module.exports = upload.single("file");
