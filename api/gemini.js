export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  
  const key = process.env.GEMINI_API_KEY;
  
  if (!key) {
    return res.json({ content: [{ text: "Error: GEMINI_API_KEY not found in environment" }] });
  }

  const { messages, system } = req.body;
  const prompt = (system || "") + "\n\n" + (messages || []).map(m => m.role + ": " + m.content).join("\n");
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    if (data.error) {
      return res.json({ content: [{ text: "API Error: " + data.error.message }] });
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    res.json({ content: [{ text }] });
  } catch(e) {
    res.json({ content: [{ text: "Fetch error: " + e.message }] });
  }
}