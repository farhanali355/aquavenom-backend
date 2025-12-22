import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // ✅ ✅ ✅ YEH 3 LINES ADD KARO (CORS FIX) ✅ ✅ ✅
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle pre-flight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== "POST") {
    return res.status(405).json({ 
      message: "Method not allowed", 
      allowed: "POST",
      received: req.method 
    });
  }

  const { amount, customerName, customerEmail, items } = req.body;

  try {
    // ✅ Check if Stripe key is loaded
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is missing');
      return res.status(500).json({ 
        success: false, 
        error: 'Server configuration error: Missing Stripe key' 
      });
    }
    
    console.log('Creating payment intent for amount:', amount);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: "usd",
      description: `Aqua Venom Purchase - ${customerName || "Customer"}`,
      metadata: {
        customer_email: customerEmail,
        customer_name: customerName,
        items_count: items?.length || 0,
        order_id: `AQUA-${Date.now()}`,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('PaymentIntent created:', paymentIntent.id);
    
    res.status(200).json({ 
      success: true, 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id 
    });
    
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      type: error.type 
    });
  }
}