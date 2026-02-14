const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async (req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Expecting POST request with { dinoId, tags }
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { dinoId, tags } = req.body;

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Missing API Key configuration on server.' });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-pro",
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
        });

        const prompt = `
      You are a chaotic, funny dinosaur personality analyzer.
      The user got the result: ${dinoId}.
      Their quiz tags were: ${JSON.stringify(tags)}.
      
      Generate a short, spicy, and humorous personality description (max 3 sentences) for them based on this result. 
      Roast them a little bit but keep it fun. 
      Don't mention the tags explicitly, just use them to flavor the text.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return res.status(200).json({ analysis: text });
    } catch (error) {
        console.error('AI Error (Using Fallback):', error);

        // Fallback Mock Responses so the app always works
        const fallbacks = [
            "AI is taking a nap, but here's the truth: You have main character energy, but the chaotic kind that stresses everyone else out.",
            "My servers are busy, but I know your type. You probably claim to be social but cancel plans 5 minutes before they start.",
            "The AI is pleading the fifth. Let's just say you're a complex individual with a very specific set of prehistoric issues.",
            "Error: Personality too spicy for the cloud. You're definitely the one who starts the drama and then watches from the sidelines eating popcorn.",
            "System overloaded by your sheer awesomeness (or stubbornness). You're the friend who says 'I know a shortcut' and gets everyone lost."
        ];
        const randomRoast = fallbacks[Math.floor(Math.random() * fallbacks.length)];

        return res.status(200).json({ analysis: randomRoast + " (Fallback Mode)" });
    }
};
