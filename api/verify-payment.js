import crypto from "crypto";

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required payment verification fields" 
      });
    }

    // Validate Razorpay secret key
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error("Missing RAZORPAY_KEY_SECRET in environment variables");
      return res.status(500).json({ 
        success: false,
        error: "Server configuration error" 
      });
    }

    // Create the expected signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    // Compare signatures
    if (expectedSignature === razorpay_signature) {
      console.log("Payment verification successful for order:", razorpay_order_id);
      
      return res.status(200).json({ 
        success: true,
        message: "Payment verified successfully",
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id
      });
    } else {
      console.warn("Invalid signature for order:", razorpay_order_id);
      
      return res.status(400).json({ 
        success: false, 
        error: "Invalid signature - Payment verification failed",
        orderId: razorpay_order_id
      });
    }

  } catch (err) {
    console.error("Payment Verification Error:", err.message);
    
    return res.status(500).json({ 
      success: false,
      error: "Payment verification failed",
      details: err.message 
    });
  }
}