// resolvers/clientResolvers.js
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
    // Trae clientes desde Facturapi y los guarda en MongoDB
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

    // Retorna todos los clientes guardados en MongoDB
    getAllClients: async () => {
      return await Client.find();
    },
  },
};

module.exports = resolvers;
