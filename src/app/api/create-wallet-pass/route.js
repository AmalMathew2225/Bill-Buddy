import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// INSTRUCTIONS for User:
// 1. Get your Issuer ID from Google Pay & Wallet Console.
// 2. Create a Service Account and download the JSON key.
// 3. Set these environment variables:
//    GOOGLE_WALLET_ISSUER_ID=your_issuer_id
//    GOOGLE_WALLET_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
//    GOOGLE_WALLET_CLIENT_EMAIL=your_service_account_email

export async function POST(request) {
    try {
        const body = await request.json();
        const { merchant, date, total, items } = body;

        // Configuration - Fallback to placeholders if not set
        const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID || '3388000000022304625'; // Placeholder
        const serviceAccountEmail = process.env.GOOGLE_WALLET_CLIENT_EMAIL || 'example@example.com';

        // Private Key needs to be real to sign correctly.
        // If not set, we'll try to use a dummy one just so the code runs (but link won't work).
        // This is a dummy example key (NOT SECURE/VALID for real use)
        const privateKey = process.env.GOOGLE_WALLET_PRIVATE_KEY
            ? process.env.GOOGLE_WALLET_PRIVATE_KEY.replace(/\\n/g, '\n')
            : null;

        if (!privateKey) {
            console.warn("Missing GOOGLE_WALLET_PRIVATE_KEY. Wallet pass generation will fail validation.");
            return NextResponse.json({
                error: 'Configuration Missing',
                message: 'Google Wallet Private Key is not configured in .env.local'
            }, { status: 500 });
        }

        const classId = `${issuerId}.billbuddy_receipt_v1`;
        const objectId = `${issuerId}.receipt_${Date.now()}`;

        // Construct the Pass Object (Generic Pass)
        const newObjects = [{
            id: objectId,
            classId: classId,
            logo: {
                sourceUri: { uri: 'https://cdn-icons-png.flaticon.com/512/1041/1041888.png' }, // Generic Receipt Icon
                contentDescription: { defaultValue: { language: 'en-US', value: 'Bill Buddy Logo' } }
            },
            cardTitle: {
                defaultValue: { language: 'en-US', value: 'Receipt' }
            },
            subheader: {
                defaultValue: { language: 'en-US', value: 'Merchant' }
            },
            header: {
                defaultValue: { language: 'en-US', value: merchant || 'Unknown Store' }
            },
            textModulesData: [
                {
                    header: 'Total Paid',
                    body: `₹${total}`,
                    id: 'total_amount'
                },
                {
                    header: 'Date',
                    body: date || new Date().toISOString().split('T')[0],
                    id: 'date'
                }
            ]
        }];

        // Add items if available
        if (items && items.length > 0) {
            const itemsList = items.map(i => `${i.name} (₹${i.price})`).join('\n');
            newObjects[0].textModulesData.push({
                header: 'Items',
                body: itemsList.substring(0, 500), // Limit length
                id: 'items_list'
            });
        }

        // Construct the JWT claims
        const claims = {
            iss: serviceAccountEmail,
            aud: 'google',
            origins: ['http://localhost:3000'],
            typ: 'savetowallet',
            payload: {
                // In a real scenario, you might need to create the Class first via API if it doesn't exist.
                // For simplicity, we are sending the object. 
                // Note: The 'classId' referenced must exist in your Google Pay Console.
                // If using 'googletagless' (JWT-only) approach, you usually include the class definition inside the JWT 
                // or ensure it's pre-created. We'll attempt a self-contained payload structure if supported, 
                // or assume the user will set up the Class ID.

                // Simplified payload for 'Skinny' JWT which relies on pre-created classes usually. 
                // Let's try to structure it as a complete Save to Wallet request.
                passObjects: newObjects
            }
        };

        const token = jwt.sign(claims, privateKey, { algorithm: 'RS256' });
        const saveUrl = `https://pay.google.com/gp/v/save/${token}`;

        return NextResponse.json({ saveUrl });

    } catch (error) {
        console.error('Error generating wallet pass:', error);
        console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
