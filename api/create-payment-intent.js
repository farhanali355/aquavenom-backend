import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  const { amount, customerName, customerEmail, items } = req.body;

  try {
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
    });

    res.status(200).json({ success: true, clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
