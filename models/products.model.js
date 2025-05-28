const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: String,
  description: String,
  product_key: String,
  price: Number,
  tax_included: Boolean,
  taxes: Array,
  unit_key: String,
  sku: String,
});

module.exports = mongoose.model('Product', productSchema);
