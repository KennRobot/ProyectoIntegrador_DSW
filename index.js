require("dotenv").config();
const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const connectDB = require("./config/conection");
const typeDefs = require("./schemas/TypeDefs");
const resolvers = require("./controllers/resolvers");

const start = async () => {
  await connectDB();

  const app = express();
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app });

  app.listen({ port: 4000 }, () =>
    console.log(`🚀 Server on http://localhost:4000${server.graphqlPath}`)
  );
};

start();
