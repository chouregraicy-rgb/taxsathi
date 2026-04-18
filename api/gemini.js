export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return res.json({ content: [{ text: "Error: API key not found" }] });

  const { messages, system } = req.body;
  
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [
          { role: "system", content: system || "" },
          ...(messages || [])
        ]
      })
    });
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || JSON.stringify(data);
    res.json({ content: [{ text }] });
  } catch(e) {
    res.json({ content: [{ text: "Error: " + e.message }] });
  }
}