import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { daoName, description, website, twitter, wallet, message } = await request.json();

    if (!daoName || !description || !wallet) {
      return NextResponse.json(
        { error: "DAO Name, Description, and Wallet are required fields." },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const emailFrom = "SynArc <onboarding@resend.dev>";
    const emailTo = "devsynarc@gmail.com";

    if (!apiKey) {
      console.warn("RESEND_API_KEY is not defined. Simulating email send for local development.");
      console.log("Simulated DAO Application:", { daoName, description, website, twitter, wallet, message });
      return NextResponse.json({ 
        success: true, 
        simulated: true, 
        message: "Email simulated (RESEND_API_KEY not configured)" 
      });
    }

    const htmlTemplate = `
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: #0A0A0F; color: #FFFFFF; padding: 24px; border-radius: 8px; margin-bottom: 24px; }
            .header h1 { margin: 0; font-size: 24px; }
            .section { margin-bottom: 20px; }
            .field { margin-bottom: 12px; }
            .label { font-weight: bold; color: #0F111A; font-size: 12px; text-transform: uppercase; }
            .value { color: #2D3748; font-size: 14px; margin-top: 4px; word-break: break-word; }
            .footer { border-top: 1px solid #E2E8F0; padding-top: 16px; font-size: 12px; color: #718096; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New DAO Application</h1>
            </div>
            
            <div class="section">
              <div class="field">
                <div class="label">DAO Name</div>
                <div class="value">${daoName}</div>
              </div>
              
              <div class="field">
                <div class="label">Description</div>
                <div class="value">${description}</div>
              </div>
              
              <div class="field">
                <div class="label">Website</div>
                <div class="value">${website || "Not provided"}</div>
              </div>
              
              <div class="field">
                <div class="label">Twitter/X</div>
                <div class="value">${twitter || "Not provided"}</div>
              </div>
              
              <div class="field">
                <div class="label">Contact Wallet</div>
                <div class="value"><code>${wallet}</code></div>
              </div>
              
              <div class="field">
                <div class="label">Why Join SynArc</div>
                <div class="value">${message || "Not provided"}</div>
              </div>
            </div>
            
            <div class="footer">
              <p>This application was submitted via SynArc.io</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Call Resend REST API directly
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: emailFrom,
        to: emailTo,
        subject: `New DAO Application — ${daoName}`,
        html: htmlTemplate,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Resend email dispatch failed: ${errorText}`);
    }

    const result = await res.json();
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("DAO Application Dispatch error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to submit DAO application." },
      { status: 500 }
    );
  }
}
