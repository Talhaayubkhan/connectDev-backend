const { GoogleGenAI } = require("@google/genai");
const { ValidationError } = require("./errors");

const generateAiChat = async (messages) => {
  // messages = [ { role: "user", content: "hello" },
  //              { role: "model", content: "hi there" }, ... ]
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Convert your simple format to what Gemini expects
    const contents = messages.map((msg) => ({
      role: msg.role, // "user" or "model"
      parts: [{ text: msg.content }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      systemInstruction: `You are a helpful, friendly assistant. 
        Be concise and clear. Keep responses short unless the user asks for detail.
        Do not use markdown formatting. No bullet points. No asterisks. No newlines.
        Write in a single continuous paragraph of plain text.`,
    });

    let cleanText = response?.text || "";
    cleanText = cleanText.replace(/\n/g, " "); // Remove newlines
    cleanText = cleanText.replace(/\*/g, ""); // Remove asterisks
    cleanText = cleanText.replace(/\s+/g, " "); // Remove multiple spaces
    cleanText = cleanText.trim(); // Trim edges

    return cleanText;
  } catch (error) {
    throw new ValidationError(error?.message);
  }
};

module.exports = { generateAiChat };
