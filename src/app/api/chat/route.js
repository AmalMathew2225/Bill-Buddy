import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { message, contextData } = body;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Construct context from receipt data if available
        let systemPrompt = `You are Maya, a helpful and friendly financial advisor for the Bill Buddy app. 
        Your goal is to help the user manage their expenses, analyze spending, and give budget advice.
        Keep your answers concise, encouraging, and emoji-friendly.
        `;

        if (contextData) {
            systemPrompt += `\n\nUser's Current Data Context:\n${JSON.stringify(contextData.substring(0, 2000))}`; // Limit context size
        }

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt }],
                },
                {
                    role: "model",
                    parts: [{ text: "Hello! I'm Maya, your Bill Buddy financial advisor. How can I help you save money today? 💰" }],
                },
            ],
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ reply: text });

    } catch (error) {
        console.error('Error in chat:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
