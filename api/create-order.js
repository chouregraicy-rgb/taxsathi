import Razorpay from "razorpay";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    const { amount, plan } = req.body;

    const order = await razorpay.orders.create({
      amount: amount,
      currency: process.env.RAZORPAY_CURRENCY || "INR",
      receipt: `receipt_${Date.now()}`,
      notes: { plan },
    });

    res.status(200).json({ id: order.id, amount: order.amount });
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ error: "Order creation failed" });
  }
}