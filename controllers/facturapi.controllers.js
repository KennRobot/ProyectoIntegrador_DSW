const axios = require('axios');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const Client = require('../models/clientes.model');
const Product = require('../models/products.model');
const Invoice = require('../models/factura.model');
const sgMail = require('@sendgrid/mail');
const FACTURAPI_KEY = process.env.FACTURAPI_KEY;

const twilio = require('twilio');

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const TWILIO_SMS_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;


const facturapi = axios.create({
  baseURL: 'https://www.facturapi.io/v2',
  headers: {
    Authorization: `Bearer ${FACTURAPI_KEY}`,
  },
});

const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});




async function generateInvoicePdf(invoiceData, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const stream = fs.createWriteStream(outputPath);

    doc.pipe(stream);

    // === ENCABEZADO CON ESTILO ===
    doc
      .rect(0, 0, doc.page.width, 70)
      .fill('#003366')
      .fillColor('white')
      .font('Helvetica-Bold')
      .fontSize(24)
      .text('FACTURA ELECTRÓNICA', 40, 25);

    // === LOGO (Predeterminado) ===
    try {
      doc.image('logo.png', doc.page.width - 120, 15, { width: 80 });
    } catch (e) {
      // Si falla, ignora el logo
    }

    doc.moveDown(3).fillColor('black');

    // === DATOS DEL CLIENTE ===
    doc.font('Helvetica').fontSize(12);
    doc.text(`Cliente: ${invoiceData.customer?.legal_name || 'N/A'}`);
    doc.text(`RFC: ${invoiceData.customer?.tax_id || 'N/A'}`);
    doc.text(`Email: ${invoiceData.customer?.email || 'N/A'}`);
    doc.moveDown(1.5);

    // === TABLA SIMULADA DE PRODUCTOS ===
    doc.font('Helvetica-Bold').fontSize(13).text('Productos:', { underline: true });
    doc.moveDown(0.5);

    // Encabezados de tabla
    doc.fontSize(11).font('Helvetica-Bold');
    const startY = doc.y;
    doc.text('Descripción', 40, startY);
    doc.text('Cantidad', 250, startY);
    doc.text('Precio Unitario', 350, startY);
    doc.text('Subtotal', 470, startY);
    doc.moveTo(40, startY + 15).lineTo(550, startY + 15).stroke();

    // Filas
    doc.font('Helvetica');
    let y = startY + 20;

    invoiceData.items.forEach(item => {
      // Asegurarse que product sea objeto con datos o al menos un objeto vacío
      const product = typeof item.product === 'object' && item.product !== null ? item.product : {};
      const desc = product.description || 'Sin descripción';
      const qty = item.quantity ?? 0;
      const unit = Number(product.price ?? 0);
      const subtotal = qty * unit;

      doc.text(desc, 40, y);
      doc.text(qty.toString(), 250, y);
      doc.text(`$${unit.toFixed(2)}`, 350, y);
      doc.text(`$${subtotal.toFixed(2)}`, 470, y);

      y += 20;
    });

    doc.moveDown(2);

    // === TOTAL CON ÉNFASIS ===
    const total = invoiceData.total ?? 0;
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#003366')
      .text(`Total: $${total.toFixed(2)}`, { align: 'right' })
      .fillColor('black');

    // === PIE DE PÁGINA ===
    doc.fontSize(10).fillColor('gray');
    doc.text(
      'Gracias por su preferencia. Esta factura ha sido generada automáticamente por nuestro sistema.',
      40,
      doc.page.height - 60,
      {
        align: 'center',
        width: doc.page.width - 80
      }
    );

    doc.end();

    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}


async function notifyClient({ phone, name, total, id }) {
  if (!phone) {
    console.error('Error enviando mensaje. Numero vacio');
    return;
  }


  const messageBody = `Hola ${name || 'cliente'}, gracias por tu compra. 
Factura generada: ${id}
Total: $${total.toFixed(2)}
PDF: El archivo se encuentra en su bandeja de correo.`;

  try {
    // Enviar SMS
    await twilioClient.messages.create({
      body: messageBody,
      from: TWILIO_SMS_NUMBER,
      to: phone,
    });

    // Enviar WhatsApp (si es número válido, con prefijo)
    if (!phone.startsWith('whatsapp:')) {
      await twilioClient.messages.create({
        body: messageBody,
        from: TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${phone}`,
      });
    }

    console.log(`Mensaje enviado a ${phone}`);
  } catch (err) {
    console.error('Error enviando mensaje:', err.message);
  }
}

//Enviar Correo
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendInvoiceByEmail({ email, name, pdfPath, facturaID, resumenIA = "" }) {
  try {
    const pdfBuffer = fs.readFileSync(pdfPath);

    const msg = {
      to: email,
      from: 'araaanteca@ittepic.edu.mx', // correo verificado en SendGrid
      subject: `Tu factura electrónica: ${facturaID}`,
      text: `Hola ${name}, gracias por tu compra. Te adjuntamos tu factura en PDF.\n\nResumen:\n${resumenIA}`,
      attachments: [
        {
          content: pdfBuffer.toString('base64'),
          filename: `${facturaID}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment',
        }
      ],
    };

    await sgMail.send(msg);
    console.log(`Factura enviada por correo a ${email}`);
  } catch (err) {
    console.error("Error enviando correo:", err.message);
  }
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

    getClientById: async (_, { id }) => {
      const client = await Client.findOne({ id }); // o por _id si es el de Mongo
      if (!client) throw new Error('Cliente no encontrado');
      return client;
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
    getProductById: async (_, { id }) => {
      return await Product.findOne({ id });
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
    updateClient: async (_, { id, input }) => {
      try {
        // Actualizar en Facturapi
        const { data: facturapiClient } = await facturapi.put(`/customers/${id}`, input);

        // Actualizar en MongoDB usando Mongoose
        const updatedClient = await Client.findOneAndUpdate(
          { id: facturapiClient.id },
          {
            legal_name: facturapiClient.legal_name,
            tax_id: facturapiClient.tax_id,
            email: facturapiClient.email,
            phone: facturapiClient.phone,
            address: facturapiClient.address,
          },
          { new: true }
        );

        if (!updatedClient) {
          throw new Error('Cliente no encontrado en MongoDB');
        }

        return updatedClient;
      } catch (error) {
        console.error('❌ Error al actualizar cliente:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'No se pudo actualizar el cliente');
      }
    },

    deleteClient: async (_, { id }) => {
      try {
        // Eliminar en Facturapi
        await facturapi.delete(`/customers/${id}`);

        // Eliminar en MongoDB
        const deletedClient = await Client.findOneAndDelete({ id });

        if (!deletedClient) {
          throw new Error('Cliente no encontrado en MongoDB');
        }

        return true;
      } catch (error) {
        console.error('❌ Error al eliminar cliente:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'No se pudo eliminar el cliente');
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

     // Actualizar Producto
    updateProduct: async (_, { id, input }) => {
      try {
        // 1. Actualizar en Facturapi
        const { data: facturapiProduct } = await facturapi.put(`/products/${id}`, input);

        // 2. Actualizar en MongoDB
        const updatedProduct = await Product.findOneAndUpdate(
          { id: facturapiProduct.id },
          {
            description: facturapiProduct.description,
            product_key: facturapiProduct.product_key,
            price: facturapiProduct.price,
            tax_included: facturapiProduct.tax_included,
            taxes: facturapiProduct.taxes,
            unit_key: facturapiProduct.unit_key,
            sku: facturapiProduct.sku,
          },
          { new: true } // para retornar el documento actualizado
        );

        if (!updatedProduct) {
          throw new Error('Producto no encontrado en MongoDB');
        }

        return updatedProduct;
      } catch (error) {
        console.error('❌ Error al actualizar producto:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'No se pudo actualizar el producto');
      }
      },


    deleteProduct: async (_, { id }) => {
      try {
        // 1. Eliminar de Facturapi
        await facturapi.delete(`/products/${id}`);

        // 2. Eliminar de MongoDB
        const result = await Product.findOneAndDelete({ id });

        if (!result) {
          throw new Error('Producto no encontrado en MongoDB');
        }

        return true;
      } catch (error) {
        console.error('❌ Error al eliminar producto:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'No se pudo eliminar el producto');
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

        // Resumen con OpenAI
        const summaryMessage = await generateSummaryWithAI(
          invoiceCreated.customer?.legal_name || 'Customer',
          invoiceCreated.items,
          invoiceCreated.total
        );


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

        const clientInDb = await Client.findOne({ id: invoiceCreated.customer.id });

        if (!clientInDb) {
          console.warn('Cliente no encontrado en base de datos. No se enviará notificación.');
        } else {
          await notifyClient({
            phone: clientInDb.phone,
            name: clientInDb.legal_name,
            total: invoiceCreated.total,
            id: invoiceCreated.id,
            mensajeIA: summaryMessage
          });
        }

        await sendInvoiceByEmail({
          email: clientInDb.email,
          name: clientInDb.legal_name,
          pdfPath,
          facturaID: invoiceCreated.id,
          resumenIA: summaryMessage
        });



        return {
          id: invoiceCreated.id,
          status: invoiceCreated.status,
          pdf_url: `local_path/${invoiceCreated.id}.pdf`,
          xml_url: invoiceCreated.xml_url
        };

      } catch (error) {
        console.error("Error creando factura:", error.response?.data || error.message || error);
        throw new Error(error.response?.data?.message || error.message || "No se pudo crear la factura");
      }
    },
  },
};

//Resumen Con IA 
async function generateSummaryWithAI(clienteNombre, productos, total) {
  const nombres = productos.map(p => p.product?.description || 'Product').join(', ');

  const prompt = `Write a short, friendly, and professional message for a customer named "${clienteNombre}".
The message should thank them for their purchase and include a summary:
- Products: ${nombres}
- Total: $${total.toFixed(2)}.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 100
    });

    return response.choices[0].message.content;

  } catch (err) {
    console.warn("⚠️ OpenAI failed, using default summary. Error:", err.message);
    return `Hello ${clienteNombre}, thank you for your purchase of ${nombres}. Total: $${total.toFixed(2)}.`;
  }
}


module.exports = resolvers;
