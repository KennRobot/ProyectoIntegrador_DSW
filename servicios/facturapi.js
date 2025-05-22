const axios = require("axios");

const FACTURAPI_SECRET_KEY = process.env.FACTURAPI_KEY;

const API = axios.create({
  baseURL: "https://www.facturapi.io/v2",
  auth: {
    username: FACTURAPI_SECRET_KEY,
    password: ""
  }
});

module.exports = {
  crearProducto: async (data) => {
    const res = await API.post("/products", data);
    return res.data;
  },

  obtenerProductos: async () => {
    const res = await API.get("/products");
    return res.data.data;
  }
};
