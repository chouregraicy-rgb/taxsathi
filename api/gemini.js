export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { messages, system } = req.body;
  const key = process.env.GEMINI_API_KEY;
  const prompt = system + "\n\n" + messages.map(m => m.role + ": " + m.content).join("\n");
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, try again.";
  res.json({ content: [{ text }] });
}