const axios = require("axios");

const facturapi = axios.create({
  baseURL: "https://www.facturapi.io/v2",
  headers: {
    Authorization: `Bearer ${process.env.FACTURAPI_KEY}`,
  },
});

module.exports = {
  crearCliente: (data) => facturapi.post("/customers", data),
  crearProducto: (data) => facturapi.post("/products", data),
  emitirFactura: (data) => facturapi.post("/invoices", data),
};
