import Stripe from "stripe";
import connectDB from "../../utils/db";
import Payment from "../../models/Payment";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = { api: { bodyParser: false } };

const buffer = async (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });

export default async function handler(req, res) {
  await connectDB(); // connect to DB

  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const sig = req.headers["stripe-signature"];
  const buf = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
  
    await Payment.create({
      stripeId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      ownerId: paymentIntent.metadata?.order_id || null,
      customerName: paymentIntent.metadata?.customer_name,
      customerEmail: paymentIntent.metadata?.customer_email,
      itemsCount: paymentIntent.metadata?.items_count,
    });

    console.log("💰 Payment saved in DB:", paymentIntent.id);
  }

  res.json({ received: true });
}
