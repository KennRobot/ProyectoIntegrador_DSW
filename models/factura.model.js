const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  facturapi_id: String,
  customer: {
    id: String,
    legal_name: String,
    tax_system: String,
    tax_id: String,
    address: {
      country: String,
      zip: String,
      state: String,
      city: String,
      street: String,
      neighborhood: String,
      exterior: String
    }
  },
  items: [
    {
      product: {
        id: String,
        description: String,
        product_key: String,
        unit_key: String,
        unit_name: String,
        price: Number,
        tax_included: Boolean,
        sku: String,
        taxes: [
          {
            rate: Number,
            type: String,
            factor: String,
            ieps_mode: String,
            withholding: Boolean
          }
        ]
      },
      quantity: Number,
      description: String,
      unit_price: Number
    }
  ],
  total: Number,
  payment_form: String,
  payment_method: String,
  use: String,
  status: String,
  pdf_url: String,
  xml_url: String,
  created_at: {
    type: Date,
    default: Date.now
  }
},{
  collection: 'Facturas'
});

module.exports = mongoose.model('Invoice', invoiceSchema);
