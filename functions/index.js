// functions/index.js
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

// Define the secret you set in the CLI
const geminiApiKey = defineSecret("GEMINI_API_KEY");

exports.generateTemplate = onCall({ secrets: [geminiApiKey] }, async (request) => {
  // The client will send the 'prompt' and 'systemPrompt' in the request data
  const { prompt, systemPrompt, schema } = request.data;

  if (!prompt || !systemPrompt) {
    throw new HttpsError("invalid-argument", "The function must be called with a 'prompt' and 'systemPrompt'.");
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey.value()}`;
  
  const payload = {
    contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\nUser Prompt: " + prompt }] }],
    generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema
    }
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Gemini API Error:", errorBody);
      throw new HttpsError("internal", "Failed to call Gemini API.");
    }

    const result = await response.json();
    return result; // Return the result directly to the client

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new HttpsError("internal", "An error occurred while generating the template.");
  }
});