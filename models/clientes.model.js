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
}, {
  collection: 'Clientes' // Aquí especificas correctamente la colección
});

// ✅ Usa nombre singular en el modelo
module.exports = mongoose.model('Client', clientSchema);
