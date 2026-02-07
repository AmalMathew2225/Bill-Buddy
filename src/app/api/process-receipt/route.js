import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request) {
    try {
        // Verify user is authenticated
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
            return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
        }

        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        // Use gemini-2.5-flash
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `
      Analyze this receipt image and extract the following information into a strictly valid JSON format:
      - merchant: The name of the store or merchant.
      - date: The date of purchase (YYYY-MM-DD format if possible).
      - total: The total amount paid (number). Prefer INR/₹ if currency is ambiguous.
      - tax: The tax amount (number, 0 if not found).
      - category: A predicted category for this expense (e.g., Groceries, Dining, Electronics, Utilities).
      - items: An array of objects with 'name' and 'price'.
      
      Return ONLY the JSON object. Do not wrap it in markdown code blocks.
    `;

        const imagePart = {
            inlineData: {
                data: buffer.toString('base64'),
                mimeType: file.type,
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        // Cleanup markdown if present
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        let data;
        try {
            data = JSON.parse(cleanText);
        } catch (e) {
            console.error("Failed to parse JSON:", cleanText);
            return NextResponse.json({ error: 'Failed to parse AI response', raw: cleanText }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error processing receipt:', error);

        // Handle specific API errors
        if (error.status === 429) {
            return NextResponse.json({ error: 'AI Service Busy (Rate Limit). Please try again in a moment.' }, { status: 429 });
        }

        return NextResponse.json({
            error: error.message || 'Internal Server Error',
            details: error.toString()
        }, { status: 500 });
    }
}
