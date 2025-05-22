const axios = require('axios');
const Client = require('../models/clientes.model');

const FACTURAPI_KEY = process.env.FACTURAPI_KEY;
const facturapi = axios.create({
  baseURL: 'https://www.facturapi.io/v2',
  headers: {
    Authorization: `Bearer ${FACTURAPI_KEY}`,
  },
});

const resolvers = {
  Query: {
    syncClientsFromFacturapi: async () => {
      try {
        const { data } = await facturapi.get('/customers');
        const customers = data.data;

        const savedClients = [];

        for (const customer of customers) {
          const existing = await Client.findOne({ id: customer.id });

          if (!existing) {
            const newClient = new Client({
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
            }
          });

            await newClient.save();
            savedClients.push(newClient);
          } else {
            savedClients.push(existing);
          }
        }

        return savedClients;
        
      } catch (error) {
        console.error('Error syncing clients:', error.message);
        throw new Error('Failed to sync clients from Facturapi');
      }
    },

    getAllClients: async () => {
      return await Client.find();
    },
  },

  Mutation: {
    createClient: async (_, { input }) => {
      try {
        // Crear cliente en Facturapi
        const { data: facturapiClient } = await facturapi.post('/customers', input);

        // 2. Crear en MongoDB
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
          }
        });

        await nuevoCliente.save(); // ✅ Esto guarda en MongoDB

        return nuevoCliente;
      } catch (error) {
        console.error('❌ Facturapi error:', error.response?.data || error.message);
        throw new Error(
            error.response?.data?.message || 'Failed to create client'
        );
    }

    },
  },
};

module.exports = resolvers;
