const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Facturación con GraphQL - Proyecto Integrador DSW',
      version: '1.0.0',
      description:
        'Documentación descriptiva de la API GraphQL para la gestión de clientes, productos y facturas mediante Facturapi. Incluye notificaciones por SMS, WhatsApp y e-mail.',
    },
    servers: [
      {
        url: 'http://localhost:4000/graphql',
        description: 'Servidor local de GraphQL',
      },
      {
        url: 'https://proyectointegrador-dsw.onrender.com/playground',
        description: 'Servidor de producción (Render)',
      },
    ],
    tags: [
      {
        name: 'Clients',
        description: 'Operaciones para crear, actualizar, eliminar y sincronizar clientes desde Facturapi.',
      },
      {
        name: 'Products',
        description: 'Operaciones para manejar productos: creación, edición, eliminación y sincronización.',
      },
      {
        name: 'Invoice',
        description: 'Generación de facturas desde productos y clientes registrados.',
      },
    ],
    paths: {
      '/graphql': {
        post: {
          tags: ['GraphQL'],
          summary: 'Ejecutar operaciones GraphQL',
          description: 'Punto único de entrada para todas las operaciones de queries y mutations definidas en el esquema GraphQL.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    query: {
                      type: 'string',
                      example: `query {
  getAllClients {
    id
    legal_name
    tax_id
    email
  }
}`,
                    },
                    variables: {
                      type: 'object',
                      example: {},
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Respuesta exitosa con los datos solicitados',
            },
            400: {
              description: 'Error en la sintaxis del query',
            },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
