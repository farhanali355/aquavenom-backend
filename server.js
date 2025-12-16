// 1. Path ko pehle import karo
const path = require('path');

// 2. Fir dotenv ko load karo, path ke saath
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// 3. Baaki imports
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');


const PORT = process.env.PORT || 3000;
const app = express();
const path = require('path');

// Serve frontend files (index.html + assets)
app.use(express.static(path.join(__dirname, '..'))); // '..' = parent folder = aquavenom

app.use(cors({
  origin: ['https://aquavenom.com'], 
  credentials: true
}));

app.use(express.json());

// ✅ **1. Create Payment Intent (MAIN FUNCTION)**
app.post('/create-payment-intent', async (req, res) => {
  try {
    console.log('💰 Payment request received');
    
    const { amount, customerEmail, customerName, items } = req.body;
    
    // Validate amount
    if (!amount || amount < 50) {
      return res.status(400).json({ 
        success: false,
        error: 'Amount must be at least $0.50 (50 cents)' 
      });
    }
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in cents
      currency: 'usd',
      description: `Aqua Venom Purchase - ${customerName || 'Customer'}`,
      metadata: {
        customer_email: customerEmail || 'customer@aquavenom.com',
        customer_name: customerName || 'Customer',
        items_count: items ? items.length : 0,
        order_id: `AQUA-${Date.now()}`
      }
    });

    console.log('✅ Payment intent created:', paymentIntent.id);
    
    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      publishableKey: 'pk_live_51SeeLQRyPVi8OEzp3ti7v5laoBq4VhRsFMCXohygraXyXaL8DVsFzSXt8dUbK6bOM5xc9ijWK3UkDtAyyeCNbhRf00RR7A5fTS'
    });
    
  } catch (error) {
    console.error('❌ Payment error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ✅ **2. Health Check**
app.get('/health', (req, res) => {
  res.json({
    status: 'live',
    service: 'Aqua Venom Payments',
    timestamp: new Date().toISOString(),
    stripe: 'connected',
    environment: 'production'
  });
});

// ✅ **3. Get Config**
app.get('/config', (req, res) => {
  res.json({
    publishableKey: 'pk_live_51SeeLQRyPVi8OEzp3ti7v5laoBq4VhRsFMCXohygraXyXaL8DVsFzSXt8dUbK6bOM5xc9ijWK3UkDtAyyeCNbhRf00RR7A5fTS',
    currency: 'usd',
    allowedCountries: ['US', 'CA', 'GB', 'AU', 'IN']
  });
});

// ✅ **4. Products API (for frontend)**
app.get('/api/products', (req, res) => {
  const products = [
    { 
      id: 1, 
      name: "Cans (DTC)", 
      price: 19.99, 
      image: "Screenshot 2025-12-15 230440.png",
      description: "6-pack: $8.99<br>Pre-order 12-pack: $19.99"
    },
    { 
      id: 2, 
      name: "Merch Collection", 
      price: 132, 
      image: "Screenshot 2025-12-15 230422.png",
      description: "T-shirt: $35<br>Hoodie: $65<br>Hat: $32"
    },
    { 
      id: 3, 
      name: "Hero Bundle (Best Value)", 
      price: 54, 
      image: "Screenshot 2025-12-15 230401.png",
      description: "12-packs cans<br>T-shirt<br>Sticker Pack"
    },
    { 
      id: 4, 
      name: "SUPERFAN BUNDLE (Limited)", 
      price: 99, 
      image: "Screenshot 2025-12-15 230330.png",
      description: "Hoodie<br>T-shirt<br>Hat<br>12-packs cans"
    }
  ];
  
  res.json(products);
});

// ✅ **5. Home Page**
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Aqua Venom - Payment Backend</title>
      <style>
        body { font-family: Arial; background: #000; color: #00FF66; text-align: center; padding: 50px; }
        h1 { font-size: 2.5rem; margin-bottom: 20px; }
        .status { color: #00FF66; font-size: 1.5rem; margin: 20px 0; }
        .endpoint { background: #111; padding: 15px; margin: 10px; border-radius: 8px; }
      </style>
    </head>
    <body>
      <h1>🚀 Aqua Venom Payment Backend</h1>
      <div class="status">✅ LIVE & RUNNING</div>
      <p>Environment: Production</p>
      <p>Stripe Mode: Live (Real Payments)</p>
      
      <div style="margin-top: 40px;">
        <h3>📌 Endpoints:</h3>
        <div class="endpoint">
          <strong>POST</strong> /create-payment-intent<br>
          <small>Create payment for checkout</small>
        </div>
        <div class="endpoint">
          <strong>GET</strong> /health<br>
          <small>Server health check</small>
        </div>
        <div class="endpoint">
          <strong>GET</strong> /config<br>
          <small>Get Stripe publishable key</small>
        </div>
        <div class="endpoint">
          <strong>GET</strong> /api/products<br>
          <small>Get products list</small>
        </div>
      </div>
      
      <p style="margin-top: 40px; color: #888;">
        Frontend: <a href="https://aquavenom.com" style="color: #00FF66;">aquavenom.com</a>
      </p>
    </body>
    </html>
  `);
});

// ✅ **6. Start Server**
app.listen(PORT, () => {
  console.log(`
🚀 AQUA VENOM PAYMENT BACKEND - PRODUCTION
──────────────────────────────────────────
✅ Server: http://localhost:${PORT}
✅ Stripe: LIVE MODE (Real Payments)
✅ Frontend: https://aquavenom.com
──────────────────────────────────────────
📌 Endpoints:
   • POST /create-payment-intent
   • GET  /health
   • GET  /config
   • GET  /api/products
──────────────────────────────────────────
⚠️  WARNING: Real payments will be processed!
──────────────────────────────────────────
  `);
});

