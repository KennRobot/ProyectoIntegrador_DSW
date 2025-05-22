const mongoose = require("mongoose");

const facturaSchema = new mongoose.Schema({
  uuid: String,
  customer: Object,
  items: Array,
  total: Number,
  created_at: Date,
});

module.exports = mongoose.model("Factura", facturaSchema);
