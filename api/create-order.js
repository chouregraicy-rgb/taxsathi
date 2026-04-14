import Razorpay from "razorpay";

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Validate environment variables
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("Missing Razorpay credentials in environment variables");
      return res.status(500).json({ 
        error: "Server configuration error: Missing Razorpay credentials" 
      });
    }

    // Initialize Razorpay with correct variable names
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,        // ✅ CORRECTED
      key_secret: process.env.RAZORPAY_KEY_SECRET, // ✅ CORRECTED
    });

    const { amount, plan } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount provided" });
    }

    // Create order with Razorpay
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay expects amount in paise (multiply by 100)
      currency: process.env.RAZORPAY_CURRENCY || "INR",
      receipt: `receipt_${Date.now()}`,
      notes: { 
        plan: plan || "subscription",
        timestamp: new Date().toISOString()
      },
    });

    console.log("Order created successfully:", order.id);

    res.status(200).json({ 
      id: order.id, 
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt
    });

  } catch (err) {
    console.error("Razorpay Order Creation Error:", err.message);
    
    // More specific error handling
    if (err.message.includes("Unauthorized")) {
      return res.status(401).json({ 
        error: "Invalid Razorpay credentials. Check your API keys." 
      });
    }
    
    if (err.message.includes("Network")) {
      return res.status(503).json({ 
        error: "Network error connecting to Razorpay" 
      });
    }

    res.status(500).json({ 
      error: "Failed to create order",
      details: err.message 
    });
  }
}