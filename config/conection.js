const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Conectado a MongoDB, Base de Datos: ${conn.connection.name}`);
  } catch (err) {
    console.error("Error conectando MongoDB:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
