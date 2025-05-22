// models/Client.js
const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  id: String,
  legal_name: String,
  tax_id: String,
  email: String,
  phone: String,
  address: {
    street: String,
    exterior: String,
    interior: String,
    neighborhood: String,
    zip: String,
    city: String,
    municipality: String,
    state: String,
    country: String,
  },
});

module.exports = mongoose.model('Client', clientSchema);
