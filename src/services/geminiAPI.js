export const sendToGemini = async (messages) => {
  const systemPrompt = {
    role: 'user',
    parts: [{ text: 'You are a helpful assistant. Answer politely and clearly.' }],
  };

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('API key is missing. Please check your .env file.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;
  console.log('API Endpoint:', endpoint);

  const apiMessages = messages.map((msg) => ({
    role: msg.role,
    parts: msg.parts,
  }));

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [systemPrompt, ...apiMessages] }),
    });

    const responseBody = await response.json();
    console.log('API Response:', responseBody);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch from Gemini API: ${responseBody.error?.message || response.statusText}`
      );
    }

    const text = responseBody.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('No valid response text found in API response.');
    }

    return text;
  } catch (error) {
    console.error('Error in sendToGemini:', error.message);
    throw error;
  }
};