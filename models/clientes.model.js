const mongoose = require("mongoose");

const clienteSchema = new mongoose.Schema({
  name: String,
  email: String,
  rfc: String,
  facturapi_id: String,
});

module.exports = mongoose.model("Cliente", clienteSchema);
