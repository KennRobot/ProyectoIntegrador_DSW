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
            const newClient = new Client(customer);
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

        // Guardar en MongoDB
        const newClient = new Client(facturapiClient);
        await newClient.save();

        return newClient;
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
