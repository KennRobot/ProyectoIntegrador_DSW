require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const playground = require('graphql-playground-middleware-express').default;
const typeDefs = require('./schemas/TypeDefs');
const resolvers = require('./controllers/facturapi.controllers');
const connectDB = require('./config/conection');

const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger.js');


const startServer = async () => {
  const app = express();

  connectDB();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    persistedQueries: false,
    introspection: true,
  });

  await server.start();
  server.applyMiddleware({ app });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/apiV1/swagger.yaml", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "apiV1", "swagger.yaml"));
  });

  app.use(express.static(path.join(__dirname, "public")));


  // Habilita el Playground en /playground
  app.get('/playground', playground({ endpoint: '/graphql' }));

  const PORT = process.env.PORT || 4000;
 app.listen(PORT, () =>
    console.log(`Servidor listo en http://localhost:${PORT}${server.graphqlPath}`)
  );
};


startServer();
