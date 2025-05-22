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

  input AddressInput {
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

  input ClientInput {
    legal_name: String!
    tax_id: String!
    email: String!
    phone: String
    address: AddressInput
  }

  type Query {
    syncClientsFromFacturapi: [Client]
    getAllClients: [Client]
  }

  type Mutation {
    createClient(input: ClientInput!): Client
  }
`;

module.exports = typeDefs;
