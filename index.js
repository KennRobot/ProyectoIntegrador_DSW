require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const playground = require('graphql-playground-middleware-express').default;
const typeDefs = require('./schemas/TypeDefs');
const resolvers = require('./controllers/facturapi.controllers');
const connectDB = require('./config/conection');

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

  // Habilita el Playground en /playground
  app.get('/playground', playground({ endpoint: '/graphql' }));

  const PORT = process.env.PORT || 4000;
 app.listen(PORT, () =>
    console.log(`Servidor listo en http://localhost:${PORT}${server.graphqlPath}`)
  );
};


startServer();
