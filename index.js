// server.js
require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./schemas/TypeDefs');
const resolvers = require('./controllers/productos.controllers');
const connectDB = require('./config/conection');

const startServer = async () => {
  const app = express();

  // Conexión a MongoDB
  connectDB();

  // Servidor Apollo
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () =>
    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`)
  );
};

startServer();
