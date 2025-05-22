const Cliente = require("../models/clientes.model");
const Producto = require("../models/productos.model");
const Factura = require("../models/factura.model");
const {
  crearCliente,
  crearProducto,
  emitirFactura,
} = require("../servicios/facturapi");

module.exports = {
  Query: {
    obtenerClientes: async () => await Cliente.find(),
    obtenerProductos: async () => await Producto.find(),
    obtenerFacturas: async () => await Factura.find(),
  },
  Mutation: {
    crearCliente: async (_, { input }) => {
      const { data } = await crearCliente(input);
      const nuevo = new Cliente({
        ...input,
        facturapi_id: data.id,
      });
      return await nuevo.save();
    },
    crearProducto: async (_, { input }) => {
      const { data } = await crearProducto(input);
      const nuevo = new Producto({
        ...input,
        facturapi_id: data.id,
      });
      return await nuevo.save();
    },
    emitirFactura: async (_, { input }) => {
      const cliente = await Cliente.findById(input.clienteId);
      const productos = await Producto.find({ _id: { $in: input.productoIds } });

      const facturaData = {
        customer: cliente.facturapi_id,
        items: productos.map(p => ({
          quantity: 1,
          product: p.facturapi_id,
        })),
        payment_form: "01",
        use: "G03",
        type: "I",
      };

      const { data } = await emitirFactura(facturaData);

      const nueva = new Factura({
        uuid: data.uuid,
        customer: cliente,
        items: productos,
        total: data.total,
        created_at: data.created_at,
      });

      return await nueva.save();
    },
  },
};
