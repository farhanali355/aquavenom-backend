import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  stripeId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  status: { type: String, required: true },
  ownerId: { type: String }, // optional, agar metadata bhejte ho
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
