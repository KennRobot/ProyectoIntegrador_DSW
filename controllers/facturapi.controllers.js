const axios = require('axios');
const Client = require('../models/clientes.model');
const Product = require('../models/products.model');

const FACTURAPI_KEY = process.env.FACTURAPI_KEY;

const facturapi = axios.create({
  baseURL: 'https://www.facturapi.io/v2',
  headers: {
    Authorization: `Bearer ${FACTURAPI_KEY}`,
  },
});

const resolvers = {
  Query: {
    // CLIENTES
    syncClientsFromFacturapi: async () => {
      try {
        const { data } = await facturapi.get('/customers');
        const customers = data.data;

        //console.log(`Clientes obtenidos de Facturapi: ${customers.length}`);
        const savedClients = [];

        for (const customer of customers) {
          const updatedClient = await Client.findOneAndUpdate(
            { id: customer.id },
            {
              id: customer.id,
              legal_name: customer.legal_name,
              tax_id: customer.tax_id,
              email: customer.email,
              phone: customer.phone,
              address: {
                street: customer.address?.street,
                exterior: customer.address?.exterior,
                interior: customer.address?.interior,
                neighborhood: customer.address?.neighborhood,
                zip: customer.address?.zip,
                city: customer.address?.city,
                municipality: customer.address?.municipality,
                state: customer.address?.state,
                country: customer.address?.country,
              },
            },
            { new: true, upsert: true } // si no existe, crea; si existe, actualiza y devuelve el nuevo documento
          );

          //console.log(`Guardado cliente: ${updatedClient.legal_name}`);
          savedClients.push(updatedClient);
        }

        //console.log(`Clientes sincronizados y guardados: ${savedClients.length}`);
        return savedClients;
      } catch (error) {
        console.error('Error syncing clients:', error.message);
        throw new Error('Failed to sync clients from Facturapi');
      }
    },

    getAllClients: async () => {
      return await Client.find();
    },

    // PRODUCTOS
    syncProductsFromFacturapi: async () => {
      try {
        const { data } = await facturapi.get('/products');
        const products = data.data;

        const savedProducts = [];

        for (const product of products) {
          const updatedProduct = await Product.findOneAndUpdate(
            { id: product.id },
            {
              id: product.id,
              description: product.description,
              product_key: product.product_key,
              price: product.price,
              tax_included: product.tax_included,
              taxes: product.taxes,
              unit_key: product.unit_key,
              sku: product.sku,
            },
            { new: true, upsert: true }
          );

          savedProducts.push(updatedProduct);
        }

        return savedProducts;
      } catch (error) {
        console.error('Error syncing products:', error.message);
        throw new Error('Failed to sync products from Facturapi');
      }
    },

    getAllProducts: async () => {
      return await Product.find();
    },
  },

  Mutation: {
    // CLIENTES
    createClient: async (_, { input }) => {
      try {
        const { data: facturapiClient } = await facturapi.post('/customers', input);

        const nuevoCliente = new Client({
          id: facturapiClient.id,
          legal_name: facturapiClient.legal_name,
          tax_id: facturapiClient.tax_id,
          email: facturapiClient.email,
          phone: facturapiClient.phone,
          address: {
            street: facturapiClient.address.street,
            exterior: facturapiClient.address.exterior,
            interior: facturapiClient.address.interior,
            neighborhood: facturapiClient.address.neighborhood,
            zip: facturapiClient.address.zip,
            city: facturapiClient.address.city,
            municipality: facturapiClient.address.municipality,
            state: facturapiClient.address.state,
            country: facturapiClient.address.country,
          },
        });

        await nuevoCliente.save();
        return nuevoCliente;
      } catch (error) {
        console.error('❌ Facturapi error (cliente):', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to create client');
      }
    },

    // PRODUCTOS
    createProduct: async (_, { input }) => {
      try {
        const { data: facturapiProduct } = await facturapi.post('/products', input);

        const nuevoProducto = new Product({
          id: facturapiProduct.id,
          description: facturapiProduct.description,
          product_key: facturapiProduct.product_key,
          price: facturapiProduct.price,
          tax_included: facturapiProduct.tax_included,
          taxes: facturapiProduct.taxes,
          unit_key: facturapiProduct.unit_key,
          sku: facturapiProduct.sku,
        });

        await nuevoProducto.save();
        return nuevoProducto;
      } catch (error) {
        console.error('❌ Facturapi error (producto):', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to create product');
      }
    },
  },
};

module.exports = resolvers;


module.exports = resolvers;
