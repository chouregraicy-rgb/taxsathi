const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { amount, planName } = req.body;

    const order = await razorpay.orders.create({
      amount: amount * 100, // paise mein
      currency: process.env.RAZORPAY_CURRENCY || "INR",
      receipt: `receipt_${Date.now()}`,
      notes: { planName },
    });

    res.status(200).json({ orderId: order.id, amount: order.amount });
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ error: "Order creation failed" });
  }
}