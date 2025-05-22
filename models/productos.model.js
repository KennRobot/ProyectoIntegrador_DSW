const mongoose = require("mongoose");

const productoSchema = new mongoose.Schema({
  description: String,
  product_key: String,
  price: Number,
  facturapi_id: String,
});

module.exports = mongoose.model("Producto", productoSchema);
