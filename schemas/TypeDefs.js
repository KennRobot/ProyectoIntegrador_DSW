const { gql } = require('apollo-server-express');

const typeDefs = gql`
  "Dirección fiscal o física del cliente"
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

  "Input para la dirección del cliente"
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

  "Cliente registrado en Facturapi y/o en MongoDB"
  type Client {
    id: ID
    legal_name: String
    tax_id: String
    email: String
    phone: String
    address: Address
  }

  "Datos necesarios para registrar un cliente"
  input ClientInput {
    legal_name: String!
    tax_id: String!
    email: String!
    phone: String
    address: AddressInput
  }

  "Datos para actualizar un cliente existente"
  input UpdateClientInput {
    legal_name: String
    tax_id: String
    email: String
    phone: String
    address: AddressInput
  }

  "Información de un impuesto asociado a un producto"
  type Tax {
    type: String
    rate: Float
  }

  "Input para definir un impuesto aplicado al producto"
  input TaxInput {
    type: String!
    rate: Float
  }

  "Producto registrado en Facturapi y/o MongoDB"
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

  "Datos necesarios para registrar un producto"
  input ProductInput {
    description: String!
    product_key: String!
    price: Float!
    tax_included: Boolean
    taxes: [TaxInput]
    unit_key: String!
    sku: String
  }

  "Datos para actualizar un producto existente"
  input UpdateProductInput {
    description: String
    product_key: String
    price: Float
    tax_included: Boolean
    taxes: [TaxInput]
    unit_key: String
    sku: String
  }

  "Input para un ítem de factura, incluye cantidad y referencia al ID del producto"
  input InvoiceItemInput {
    quantity: Float!
    product: String!
  }

  "Input para crear una factura con cliente, productos y método de pago"
  input InvoiceInput {
    customer: String!
    items: [InvoiceItemInput!]!
    payment_form: String
    payment_method: String
    use: String
  }

  "Factura generada en Facturapi y guardada en MongoDB"
  type Invoice {
    id: String
    status: String
    pdf_url: String
    xml_url: String
    customer: String
    created_at: String
  }

  type Query {
    "Sincroniza todos los clientes desde Facturapi a MongoDB"
    syncClientsFromFacturapi: [Client]

    "Obtiene todos los clientes desde MongoDB"
    getAllClients: [Client]

    "Sincroniza todos los productos desde Facturapi a MongoDB"
    syncProductsFromFacturapi: [Product]

    "Obtiene todos los productos desde MongoDB"
    getAllProducts: [Product]
  }

  type Mutation {
    "Crea un cliente en Facturapi y lo guarda en MongoDB"
    createClient(input: ClientInput!): Client

    "Actualiza un cliente por ID en Facturapi y MongoDB"
    updateClient(id: ID!, input: UpdateClientInput!): Client

    "Elimina un cliente por ID en Facturapi y MongoDB"
    deleteClient(id: ID!): Boolean

    "Crea un producto en Facturapi y lo guarda en MongoDB"
    createProduct(input: ProductInput!): Product

    "Actualiza un producto por ID en Facturapi y MongoDB"
    updateProduct(id: ID!, input: UpdateProductInput!): Product

    "Elimina un producto por ID en Facturapi y MongoDB"
    deleteProduct(id: ID!): Boolean

    "Genera una factura en Facturapi y la guarda en MongoDB"
    createInvoice(input: InvoiceInput!): Invoice
  }
`;

module.exports = typeDefs;
