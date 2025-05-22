const mongoose = require("mongoose");

const productoSchema = new mongoose.Schema({
  id: String,
  description: String,
  product_key: String,
  price: Number,
  sku: String,
  created_at: Date,
  updated_at: Date
});

module.exports = mongoose.model("Producto", productoSchema);
