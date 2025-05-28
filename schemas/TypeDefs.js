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

  input ProductInput {
  description: String!
  product_key: String!
  price: Float!
  tax_included: Boolean
  taxes: [TaxInput]
  unit_key: String!
  sku: String
  }

  input TaxInput {
    type: String!
    rate: Float
  }

  type Product {
    id: ID
    description: String
    product_key: String
    price: Float
    tax_included: Boolean
    taxes: [Tax]
    unit_key: String
    sku: String
  }

  type Tax {
    type: String
    rate: Float
  }
  
input InvoiceItemInput {
  quantity: Float!
  product: String! 
}


input InvoiceInput {
  customer: String!
  items: [InvoiceItemInput!]!
  payment_form: String
  payment_method: String
  use: String
}

type Invoice {
  id: String
  status: String
  pdf_url: String
  xml_url: String
  customer: String
  created_at: String
}


  type Query {
    syncClientsFromFacturapi: [Client]
    getAllClients: [Client]

    syncProductsFromFacturapi: [Product]
    getAllProducts: [Product]
  }

  type Mutation {
    createClient(input: ClientInput!): Client
    createProduct(input: ProductInput!): Product
    createInvoice(input: InvoiceInput!): Invoice
  }
`;

module.exports = typeDefs;
