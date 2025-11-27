const mongoose = require("mongoose");

const SearchHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  patron: {
    type: String,
    required: true
  },
  resultados: {
    type: [String],
    default: []
  },
  totalCoincidencias: {
    type: Number,
    required: true
  },
  archivoCsv: {
    type: String,
    required: true
  },
  duracionMs: {
    type: Number,
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("SearchHistory", SearchHistorySchema);
