const axios = require('axios');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const Client = require('../models/clientes.model');
const Product = require('../models/products.model');
const Invoice = require('../models/factura.model');

const FACTURAPI_KEY = process.env.FACTURAPI_KEY;

const facturapi = axios.create({
  baseURL: 'https://www.facturapi.io/v2',
  headers: {
    Authorization: `Bearer ${FACTURAPI_KEY}`,
  },
});

async function generateInvoicePdf(invoiceData, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30 });
    const stream = fs.createWriteStream(outputPath);

    doc.pipe(stream);

    // Cabecera
    doc.fontSize(18).text('Factura', { align: 'center' });
    doc.moveDown();

    // Cliente
    doc.fontSize(12).text(`Cliente: ${invoiceData.customer.legal_name || 'N/A'}`);
    doc.text(`RFC: ${invoiceData.customer.tax_id || 'N/A'}`);
    doc.text(`Email: ${invoiceData.customer.email || 'N/A'}`);
    doc.moveDown();

    // Items
    doc.text('Productos:');
    invoiceData.items.forEach((item, i) => {
      const description = item.product?.description || 'Sin descripción';
      const quantity = item.quantity ?? 0;
      const unitPrice = Number(item.unit_price ?? 0);

      doc.text(
        `${i + 1}. ${description} - Cantidad: ${quantity} - Precio Unitario: $${unitPrice.toFixed(2)}`
      );
    });

    doc.moveDown();

    // Total
    const total = invoiceData.total ?? 0;
    doc.fontSize(14).text(`Total: $${total.toFixed(2)}`, { align: 'right' });

    doc.end();

    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

const resolvers = {
  Query: {
    // CLIENTES
    syncClientsFromFacturapi: async () => {
      try {
        const { data } = await facturapi.get('/customers');
        const customers = data.data;
        const savedClients = [];

        for (const customer of customers) {
          const updatedClient = await Client.findOneAndUpdate(
            { id: customer.id },
            {
              id: customer.id,
              legal_name: customer.legal_name,
              tax_id: customer.tax_id,
              email: customer.email,
              phone: customer.phone,
              address: {
                street: customer.address?.street,
                exterior: customer.address?.exterior,
                interior: customer.address?.interior,
                neighborhood: customer.address?.neighborhood,
                zip: customer.address?.zip,
                city: customer.address?.city,
                municipality: customer.address?.municipality,
                state: customer.address?.state,
                country: customer.address?.country,
              },
            },
            { new: true, upsert: true }
          );

          savedClients.push(updatedClient);
        }

        return savedClients;
      } catch (error) {
        console.error('Error syncing clients:', error.message);
        throw new Error('Failed to sync clients from Facturapi');
      }
    },

    getAllClients: async () => {
      return await Client.find();
    },

    // PRODUCTOS
    syncProductsFromFacturapi: async () => {
      try {
        const { data } = await facturapi.get('/products');
        const products = data.data;
        const savedProducts = [];

        for (const product of products) {
          const updatedProduct = await Product.findOneAndUpdate(
            { id: product.id },
            {
              id: product.id,
              description: product.description,
              product_key: product.product_key,
              price: product.price,
              tax_included: product.tax_included,
              taxes: product.taxes,
              unit_key: product.unit_key,
              sku: product.sku,
            },
            { new: true, upsert: true }
          );

          savedProducts.push(updatedProduct);
        }

        return savedProducts;
      } catch (error) {
        console.error('Error syncing products:', error.message);
        throw new Error('Failed to sync products from Facturapi');
      }
    },

    getAllProducts: async () => {
      return await Product.find();
    },
  },

  Mutation: {
    // CLIENTES
    createClient: async (_, { input }) => {
      try {
        const { data: facturapiClient } = await facturapi.post('/customers', input);

        const nuevoCliente = new Client({
          id: facturapiClient.id,
          legal_name: facturapiClient.legal_name,
          tax_id: facturapiClient.tax_id,
          email: facturapiClient.email,
          phone: facturapiClient.phone,
          address: {
            street: facturapiClient.address.street,
            exterior: facturapiClient.address.exterior,
            interior: facturapiClient.address.interior,
            neighborhood: facturapiClient.address.neighborhood,
            zip: facturapiClient.address.zip,
            city: facturapiClient.address.city,
            municipality: facturapiClient.address.municipality,
            state: facturapiClient.address.state,
            country: facturapiClient.address.country,
          },
        });

        await nuevoCliente.save();
        return nuevoCliente;
      } catch (error) {
        console.error('❌ Facturapi error (cliente):', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to create client');
      }
    },

    // PRODUCTOS
    createProduct: async (_, { input }) => {
      try {
        const { data: facturapiProduct } = await facturapi.post('/products', input);

        const nuevoProducto = new Product({
          id: facturapiProduct.id,
          description: facturapiProduct.description,
          product_key: facturapiProduct.product_key,
          price: facturapiProduct.price,
          tax_included: facturapiProduct.tax_included,
          taxes: facturapiProduct.taxes,
          unit_key: facturapiProduct.unit_key,
          sku: facturapiProduct.sku,
        });

        await nuevoProducto.save();
        return nuevoProducto;
      } catch (error) {
        console.error('❌ Facturapi error (producto):', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to create product');
      }
    },

    // FACTURAS
    createInvoice: async (_, { input }) => {
      try {
        const itemsComplete = await Promise.all(
          input.items.map(async (item) => {
            const product = await Product.findOne({ id: item.product });
            if (!product) throw new Error(`Producto con id ${item.product} no encontrado`);

            return {
              quantity: item.quantity,
              product: {
                description: product.description,
                product_key: product.product_key,
                price: product.price,
                tax_included: product.tax_included,
                taxes: product.taxes,
                unit_key: product.unit_key,
                sku: product.sku,
              },
            };
          })
        );

        const { data: invoiceCreated } = await facturapi.post('/invoices', {
          customer: input.customer,
          items: itemsComplete,
          payment_form: input.payment_form,
          payment_method: input.payment_method,
          use: input.use,
        });

        const mongoInvoice = new Invoice({
          facturapi_id: invoiceCreated.id,
          customer: invoiceCreated.customer,
          items: invoiceCreated.items.map(item => {
            let taxes = item.product.taxes;

            if (typeof taxes === 'string') {
              try {
                taxes = JSON.parse(taxes);
              } catch (e) {
                console.warn('No se pudo parsear taxes, se asigna arreglo vacío', e);
                taxes = [];
              }
            }

            taxes = Array.isArray(taxes)
              ? taxes.map(t => typeof t === 'string' ? t : JSON.stringify(t))
              : [];

            return {
              product: {
                ...item.product,
                taxes
              },
              quantity: item.quantity,
              description: item.description,
              unit_price: item.unit_price
            };
          }),
          total: invoiceCreated.total,
          payment_form: invoiceCreated.payment_form,
          payment_method: invoiceCreated.payment_method,
          use: invoiceCreated.use,
          status: invoiceCreated.status,
          pdf_url: invoiceCreated.pdf_url,
          xml_url: invoiceCreated.xml_url
        });

        await mongoInvoice.save();

        const invoicesDir = path.join(__dirname, '../facturas');
        if (!fs.existsSync(invoicesDir)) {
          fs.mkdirSync(invoicesDir);
        }

        const pdfPath = path.join(invoicesDir, `${invoiceCreated.id}.pdf`);

        await generateInvoicePdf(invoiceCreated, pdfPath);

        console.log(`PDF generado en ${pdfPath}`);

        return {
          id: invoiceCreated.id,
          status: invoiceCreated.status,
          pdf_url: `local_path/${invoiceCreated.id}.pdf`,
          xml_url: invoiceCreated.xml_url
        };

      } catch (error) {
        console.error("❌ Error creando factura:", error.response?.data || error.message || error);
        throw new Error(error.response?.data?.message || error.message || "No se pudo crear la factura");
      }
    },
  },
};

module.exports = resolvers;
