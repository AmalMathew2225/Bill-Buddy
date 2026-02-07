import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Google Wallet Service Account from credentials
const SERVICE_ACCOUNT = {
  type: "service_account",
  project_id: "cobalt-sector-473115-p5",
  private_key_id: "6d49e718c0d17683ed694d7f2c4ace921a9624ee",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDPyWGngjsksoWM\n6Z6H82r7w7ljuZt/uHuXqIuhrYOF4T6jw1BgOd3FStvXoCwtnMNtlTdWCIf18f3P\nOJDrYnvn68/gv7aW4BvJHpjGUFD/zyq2G61lOw9lwO+g/PXutsB8FOJevzqTjCYN\n3MG8D0lwe+Z85GrQlbm4k2HWfMaQfN1MNQrPnQkrYUxq1WJEQHr/Hh9/R0i6d3yT\njTAqYkqjnvRhKYX6sFgnvwssfbJR4QFaUGrJ595U59ezin72SYxhBOaQnFs/VD++\nREX3M9I59jIJgIlRhT390CcZAWfcm0pCDoo3xVoBkYeNviWktU0/lYUTooe0DqaN\nYRe9XyeHAgMBAAECggEAA/v6kWRf5J4/t/9VeN85XUaC1t9c6fVho/t+t0Tv0Vth\nAMbiqFWzuPAXMxVGg5a5Re/8ivvIOku/mtTyLRv1qvF3Sk9NcwCCco18TyEvIcND\n2xDAzGt2Kh9UTk6gxfO0e9dIAppsHHQtg/UzCdDJObeb0yfrccB35TV+RMdJD3As\noaC0MHD+XTRd0qdjTJ/jVTKYaL/ePfntSz28npwSIs8FAq282VOOw/LQssutOs5e\nTu5NFXkjAE/64pO3eD9xilTMpqQz23+QpZ+D1DDy1+L6BcCwNzL/rcTvClw0eFVk\nYGCslw3q2hpZ30OE3btX/V764isks6ll4MRssjSk0QKBgQD5TDNdzN1AFE7j6AN8\nCAiMic9r2O3jof1Df4AcaOnp9wMfJWaRf5co+o0JToBnEoXQYTHSO/K4p8p62Z6v\nGJHdIs0WYVfEfyenrjekXeTsQhGCaQfwUfwL06KFZIKWxgP+32Z/zLFVz3kGlSid\nyveHaNVa1wxI4jDx/32fGQ5pDQKBgQDVX3ra0RLfUosRqDE/MAaBdDxP0+yudtSM\nf6xo1mFGJewiBupMz8KnvV/HaakWUcW1zSEJl/Zom0J3Wzl8NweVWXJIWo2NcNf0\nlAXRDlpd/Tn+HJduyNRBWs8UVf1+RVZecg93QbBaBdk4zJH5IdAp65p+edTP1euE\nCWnCh4XF4wKBgEJcA0xTrQ1SmpFWAB9y7/ug72Kw0toGE6l09gAZ+TH7O4x94yiV\nwwH4d7RjfhBxwMbwKFfi90AqAd7jsLbBHoqzqc3sSXWXt1GOMWeCSt6M06ZYGPHi\nkOoBAsDpOU2zFfsxMlKQhR/nYzraV35xOaSExk4w8icwdoDkVmcUP169AoGBAI46\nX+Ud+it8lRDHAVSySZPfDBjWFe1Rbmrc6+rSA/NDcfxYibN7xbAULpT5HGmxRk3i\nF0SS1AB0hcCTwWTINbja76/FFJgUgQ8Z4CqzG4+NLSvymQqSudF6m5BdpWSXCXRZ\nKXAADHJldZ9D1YWwgVaAIvJteWq0mJHhyGqP9Z6rAoGBAPfRZ/JiSltbfwjC8aAx\n+GYDEpQKPJepFRkBsGWyED5lc3Ygl3AwVxoQN0+fpL6m9jkUkYt1PWp+Hk1t916I\n4xloL8Unw+lG7xHpfxEuJzIrBjh45RmJmrBWdpdqHAJSp1Dtc4GeRv20TL28LR17\npnM9bkCUT51TrFcHM3KGsa4d\n-----END PRIVATE KEY-----\n",
  client_email: "gemini-access-account@cobalt-sector-473115-p5.iam.gserviceaccount.com",
  client_id: "118017330389037859809"
};

const ISSUER_ID = "3388000000022304625"; // Default Google Wallet Issuer ID

export async function POST(request) {
  try {
    const receiptData = await request.json();
    const { merchant, date, total, items, category } = receiptData;

    // Create a unique class and object ID
    const classId = `${ISSUER_ID}.billbuddy_receipt`;
    const objectId = `${ISSUER_ID}.receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Build the wallet pass object
    const walletObject = {
      id: objectId,
      classId: classId,
      genericClass: {
        id: classId,
        issuerName: "Bill Buddy",
        reviewStatus: "UNDER_REVIEW",
        cardTitle: {
          defaultValue: {
            language: "en-US",
            value: "Receipt"
          }
        }
      },
      genericData: {
        title: {
          defaultValue: {
            language: "en-US",
            value: merchant || "Receipt"
          }
        },
        subtitle: {
          defaultValue: {
            language: "en-US",
            value: category || "Purchase"
          }
        },
        fields: [
          {
            id: "total",
            label: {
              defaultValue: {
                language: "en-US",
                value: "Amount"
              }
            },
            value: {
              defaultValue: {
                language: "en-US",
                value: `₹${parseFloat(total || 0).toFixed(2)}`
              }
            }
          },
          {
            id: "date",
            label: {
              defaultValue: {
                language: "en-US",
                value: "Date"
              }
            },
            value: {
              defaultValue: {
                language: "en-US",
                value: date || new Date().toISOString().split('T')[0]
              }
            }
          }
        ]
      }
    };

    // Add items if available
    if (items && items.length > 0) {
      const itemsList = items
        .map(i => `${i.name}: ₹${parseFloat(i.price || 0).toFixed(2)}`)
        .slice(0, 5)
        .join("\n");
      
      walletObject.genericData.fields.push({
        id: "items",
        label: {
          defaultValue: {
            language: "en-US",
            value: "Items"
          }
        },
        value: {
          defaultValue: {
            language: "en-US",
            value: itemsList
          }
        }
      });
    }

    // Create JWT payload for Google Wallet
    const iat = Math.floor(Date.now() / 1000);
    const payload = {
      iss: SERVICE_ACCOUNT.client_email,
      aud: "google",
      typ: "savetowallet",
      iat: iat,
      exp: iat + 3600,
      payload: {
        genericObjects: [walletObject]
      }
    };

    // Sign the JWT with RS256
    const token = jwt.sign(payload, SERVICE_ACCOUNT.private_key, {
      algorithm: 'RS256',
      header: {
        kid: SERVICE_ACCOUNT.private_key_id
      }
    });

    const saveUrl = `https://pay.google.com/gp/v/save/${token}`;

    return NextResponse.json({
      success: true,
      saveUrl: saveUrl
    });

  } catch (error) {
    console.error('Error creating wallet pass:', error);
    return NextResponse.json({
      error: 'Failed to create wallet pass',
      details: error.message
    }, { status: 500 });
  }
}

