// swagger.js
const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentada de Jugadores',
      version: '1.0.0',
      description: 'Documentación Swagger de todos los endpoints de la API',
    },
    servers: [
      {
        url: 'http://localhost:3000/apiV1/usuarios',
        description: 'Servidor local'
      },
      {
        url: 'https://desarrollar-api-documentada.onrender.com/apiV1/usuarios',
        description: 'Servidor de producción'
      }
    ],
    tags: [
      { name: 'Users', description: 'Operaciones sobre usuarios' },
      { name: 'Progress', description: 'Progreso y niveles de usuario' },
      { name: 'Friend Requests', description: 'Solicitudes de amistad' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        // ... tus schemas aquí ...
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './routes/*.js',
    './controllers/*.js'
  ]
};
const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
