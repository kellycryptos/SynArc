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
    const emailFrom = process.env.EMAIL_FROM || "devsynarc@gmail.com";
    const emailTo = "devsynarc@gmail.com";

    if (!apiKey) {
      console.warn("RESEND_API_KEY is not defined. Simulating email send for local development.");
      return NextResponse.json({ 
        success: true, 
        simulated: true, 
        message: "Email logged in console because RESEND_API_KEY env is missing." 
      });
    }

    // Call Resend REST API directly using standard fetch (zero external dependencies required!)
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
        text: `DAO Name: ${daoName}
Description: ${description}
Website: ${website || "None"}
Twitter: ${twitter || "None"}
Wallet: ${wallet}
Message: ${message || "None"}`,
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
