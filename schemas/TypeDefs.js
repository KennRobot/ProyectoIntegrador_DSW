const { gql } = require("apollo-server-express");

const TypeDefs = gql`
  type Cliente {
    id: ID!
    name: String
    email: String
    rfc: String
    facturapi_id: String
  }

  type Producto {
    id: ID!
    description: String
    product_key: String
    price: Float
    facturapi_id: String
  }

  type Factura {
    id: ID!
    uuid: String
    customer: Cliente
    items: [Producto]
    total: Float
    created_at: String
  }

  input ClienteInput {
    name: String!
    email: String!
    rfc: String!
  }

  input ProductoInput {
    description: String!
    product_key: String!
    price: Float!
  }

  input FacturaInput {
    clienteId: ID!
    productoIds: [ID!]!
  }

  type Query {
    obtenerClientes: [Cliente]
    obtenerProductos: [Producto]
    obtenerFacturas: [Factura]
  }

  type Mutation {
    crearCliente(input: ClienteInput!): Cliente
    crearProducto(input: ProductoInput!): Producto
    emitirFactura(input: FacturaInput!): Factura
  }
`;

module.exports = TypeDefs;