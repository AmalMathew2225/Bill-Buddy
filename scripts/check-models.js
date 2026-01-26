const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

async function listModels() {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/GEMINI_API_KEY=(.*)/);

        if (!match) {
            console.error("GEMINI_API_KEY not found in .env.local");
            return;
        }

        const apiKey = match[1].trim();
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Dummy model to get client

        // There isn't a direct listModels on the client instance in the node SDK easily exposed 
        // without using the API directly or checking the manager if available.
        // However, we can try to hit the REST API directly for listing models.

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.log("Error listing models:", JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
