// schemas/clientSchema.js
const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Address {
    street: String
    exterior: String
    interior: String
    neighborhood: String
    zip: String
    city: String
    municipality: String
    state: String
    country: String
  }

  type Client {
    id: ID
    legal_name: String
    tax_id: String
    email: String
    phone: String
    address: Address
  }

  type Query {
    syncClientsFromFacturapi: [Client]
    getAllClients: [Client]
  }
`;

module.exports = typeDefs;
