// api/gst.js — Vercel Serverless Function
// Proxies WhiteBooks GSP API calls to avoid CORS

export default async function handler(req, res) {
  // Allow CORS from TaxSaathi frontend
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action, payload } = req.body;

  // WhiteBooks credentials from Vercel env vars
  const WB_BASE = "https://developer.whitebooks.in";
  const GST_CLIENT_ID = process.env.VITE_WB_GST_CLIENT_ID;
  const GST_CLIENT_SECRET = process.env.VITE_WB_GST_CLIENT_SECRET;
  const EWB_CLIENT_ID = process.env.VITE_WB_EWB_CLIENT_ID;
  const EWB_CLIENT_SECRET = process.env.VITE_WB_EWB_CLIENT_SECRET;
  const EINV_CLIENT_ID = process.env.VITE_WB_EINV_CLIENT_ID;
  const EINV_CLIENT_SECRET = process.env.VITE_WB_EINV_CLIENT_SECRET;

  // Route actions to correct WhiteBooks endpoints
  const routes = {
    // GST Authentication
    "otp_request":    { url: "/gsp/gst/authenticate/otprequest",  cid: GST_CLIENT_ID,  cs: GST_CLIENT_SECRET },
    "otp_verify":     { url: "/gsp/gst/authenticate/authtoken",   cid: GST_CLIENT_ID,  cs: GST_CLIENT_SECRET },
    // GSTR Filing
    "gstr1_save":     { url: "/gsp/gst/returns/gstr1/save",       cid: GST_CLIENT_ID,  cs: GST_CLIENT_SECRET },
    "gstr1_submit":   { url: "/gsp/gst/returns/gstr1/submit",     cid: GST_CLIENT_ID,  cs: GST_CLIENT_SECRET },
    "gstr3b_save":    { url: "/gsp/gst/returns/gstr3b/save",      cid: GST_CLIENT_ID,  cs: GST_CLIENT_SECRET },
    "gstr3b_submit":  { url: "/gsp/gst/returns/gstr3b/submit",    cid: GST_CLIENT_ID,  cs: GST_CLIENT_SECRET },
    // GSTIN Lookup
    "gstin_search":   { url: "/gsp/gst/taxpayerapi/search",       cid: GST_CLIENT_ID,  cs: GST_CLIENT_SECRET },
    // e-Way Bill
    "ewb_generate":   { url: "/gsp/ewb/ewayapi/generate",         cid: EWB_CLIENT_ID,  cs: EWB_CLIENT_SECRET },
    "ewb_cancel":     { url: "/gsp/ewb/ewayapi/cancel",           cid: EWB_CLIENT_ID,  cs: EWB_CLIENT_SECRET },
    // e-Invoice
    "einv_generate":  { url: "/gsp/einv/einvoiceapi/generate",    cid: EINV_CLIENT_ID, cs: EINV_CLIENT_SECRET },
    "einv_cancel":    { url: "/gsp/einv/einvoiceapi/cancel",      cid: EINV_CLIENT_ID, cs: EINV_CLIENT_SECRET },
    "einv_getirn":    { url: "/gsp/einv/einvoiceapi/getirn",      cid: EINV_CLIENT_ID, cs: EINV_CLIENT_SECRET },
  };

  const route = routes[action];
  if (!route) {
    return res.status(400).json({ error: `Unknown action: ${action}` });
  }

  try {
    const headers = {
      "Content-Type": "application/json",
      "clientid": route.cid,
      "clientsecret": route.cs,
    };

    // Add auth token if provided
    if (payload.authtoken) {
      headers["authtoken"] = payload.authtoken;
      delete payload.authtoken;
    }
    if (payload.gstin_header) {
      headers["gstin"] = payload.gstin_header;
      delete payload.gstin_header;
    }
    if (payload.ret_period_header) {
      headers["ret_period"] = payload.ret_period_header;
      delete payload.ret_period_header;
    }
    if (payload.username_header) {
      headers["username"] = payload.username_header;
      delete payload.username_header;
    }

    const response = await fetch(`${WB_BASE}${route.url}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); }
    catch { data = { raw: text }; }

    return res.status(200).json({
      ok: response.ok,
      status: response.status,
      data,
    });

  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}
