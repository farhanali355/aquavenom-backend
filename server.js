// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();

/* ---------- MIDDLEWARE ---------- */
app.use(cors({ origin: 'https://aquavenom.com' }));

// Stripe webhook ke liye RAW body
app.post(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      console.log("💰 Payment received:", paymentIntent.id);
    }

    res.json({ received: true });
  }
);

// JSON middleware webhook ke BAAD
app.use(express.json());

/* ---------- ROUTES ---------- */

// Health check
app.get("/api/test", (req, res) => {
  res.send("Backend is working 🚀");
});

// Payment intent
app.post("/api/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency, customerDetails, items } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency || "usd",
      metadata: {
        customer_name: customerDetails?.name,
        customer_email: customerDetails?.email,
        items: JSON.stringify(items || []),
      },
      description: `Order for ${customerDetails?.name || "Customer"}`,
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/* ---------- SERVER ---------- */
const PORT = process.env.PORT || 3000;

// Local development ke liye
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Vercel ke liye export (IMPORTANT!)
module.exports = app;