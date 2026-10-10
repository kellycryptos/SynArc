import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = "devsynarc@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const { name, email, category, message, walletAddress } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required so we can reply to you." },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || message.trim().length < 5) {
      return NextResponse.json(
        { error: "Please enter a message or feedback with at least 5 characters." },
        { status: 400 }
      );
    }

    const selectedCategory = category || "General Feedback";
    const senderName = name?.trim() || "Anonymous Contributor";
    const userMessage = message.trim();
    const timestamp = new Date().toUTCString();
    const apiKey = process.env.RESEND_API_KEY;

    // Development / simulated fallback when no API key is set
    if (!apiKey || apiKey === "re_mock_key") {
      console.warn("RESEND_API_KEY not set. Simulating contact message delivery.");
      console.log(`[CONTACT / FEEDBACK] Category: ${selectedCategory} | From: ${senderName} <${email}> | Wallet: ${walletAddress || "N/A"}`);
      console.log(`[MESSAGE CONTENT]:\n${userMessage}`);
      console.log(`[DELIVERY TARGET]: ${ADMIN_EMAIL}`);

      return NextResponse.json({
        success: true,
        simulated: true,
        message: `Your message has been received and forwarded to ${ADMIN_EMAIL}.`,
      });
    }

    const resend = new Resend(apiKey);

    // 1. Dispatch email to devsynarc@gmail.com with reply_to set to user's email
    await resend.emails.send({
      from: "Syn DAO Portal <onboarding@resend.dev>",
      to: ADMIN_EMAIL,
      replyTo: email,
      subject: `[Syn DAO ${selectedCategory}] Message from ${senderName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #0A0D14; color: #F5F7FA; border-radius: 12px; border: 1px solid #1E293B; overflow: hidden; padding: 26px;">
          <div style="border-bottom: 1px solid #1E293B; padding-bottom: 16px; margin-bottom: 20px;">
            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
              <span style="font-family: monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #2F6FFF; background: rgba(47,111,255,0.15); border: 1px solid rgba(47,111,255,0.3); padding: 4px 10px; border-radius: 9999px;">
                ${selectedCategory}
              </span>
            </div>
            <h2 style="font-size: 22px; font-weight: 700; margin: 0; color: #FFFFFF;">
              New Feedback & Inquiry Received
            </h2>
            <p style="font-size: 13px; color: #94A3B8; margin-top: 6px; margin-bottom: 0;">
              Submitted through the Syn DAO contact portal. You can reply directly to this email to answer the user.
            </p>
          </div>

          <!-- Sender Details -->
          <div style="background: #111827; border: 1px solid #1F2937; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #94A3B8; width: 130px; font-family: monospace; font-size: 11px;">NAME</td>
                <td style="padding: 6px 0; font-weight: 600; color: #FFFFFF;">${senderName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94A3B8; font-family: monospace; font-size: 11px;">REPLY EMAIL</td>
                <td style="padding: 6px 0; font-weight: 600; color: #60A5FA;">
                  <a href="mailto:${email}" style="color: #60A5FA; text-decoration: underline;">${email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94A3B8; font-family: monospace; font-size: 11px;">CATEGORY</td>
                <td style="padding: 6px 0; color: #CBD5E1;">${selectedCategory}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94A3B8; font-family: monospace; font-size: 11px;">WALLET</td>
                <td style="padding: 6px 0; font-family: monospace; color: #E2E8F0; font-size: 12px; word-break: break-all;">
                  ${walletAddress || "Not connected"}
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94A3B8; font-family: monospace; font-size: 11px;">SENT AT</td>
                <td style="padding: 6px 0; font-family: monospace; color: #94A3B8; font-size: 12px;">${timestamp}</td>
              </tr>
            </table>
          </div>

          <!-- Message Body -->
          <div style="margin-bottom: 24px;">
            <div style="font-family: monospace; font-size: 11px; text-transform: uppercase; color: #94A3B8; margin-bottom: 8px; letter-spacing: 1px;">
              MESSAGE CONTENT
            </div>
            <div style="background: #0D131F; border: 1px solid #1E293B; border-left: 3px solid #2F6FFF; border-radius: 6px; padding: 18px; font-size: 14px; line-height: 1.7; color: #F1F5F9; white-space: pre-wrap; word-break: break-word;">
${userMessage}
            </div>
          </div>

          <div style="border-top: 1px solid #1E293B; padding-top: 14px; font-size: 12px; color: #64748B;">
            Sent automatically to <code style="color: #94A3B8;">${ADMIN_EMAIL}</code>. Hit "Reply" to message the sender directly.
          </div>
        </div>
      `,
    });

    // 2. Try sending an automatic confirmation to user (in isolated try/catch)
    try {
      await resend.emails.send({
        from: "Syn DAO Support <onboarding@resend.dev>",
        to: email,
        subject: `We received your message — Syn DAO (${selectedCategory})`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0D14; color: #F5F7FA; border-radius: 12px; border: 1px solid #1E293B; padding: 24px;">
            <h2 style="color: #FFFFFF; font-size: 20px; margin-top: 0;">Thanks for reaching out, ${senderName}!</h2>
            <p style="color: #94A3B8; font-size: 14px; line-height: 1.6;">
              We have received your ${selectedCategory.toLowerCase()} message. Our core contributor team reviews every submission and will reply to this email thread shortly.
            </p>
            <div style="background: #111827; border: 1px solid #1F2937; border-radius: 8px; padding: 14px; margin: 18px 0;">
              <p style="font-size: 12px; font-family: monospace; color: #94A3B8; margin: 0 0 6px 0;">YOUR MESSAGE COPY:</p>
              <p style="font-size: 13px; color: #E2E8F0; margin: 0; white-space: pre-wrap;">${userMessage}</p>
            </div>
            <p style="font-size: 12px; color: #64748B; margin: 0;">
              Direct team email: <a href="mailto:${ADMIN_EMAIL}" style="color: #60A5FA;">${ADMIN_EMAIL}</a>
            </p>
          </div>
        `,
      });
    } catch (confErr) {
      console.warn("User confirmation receipt omitted:", confErr);
    }

    return NextResponse.json({
      success: true,
      message: `Your message has been sent to ${ADMIN_EMAIL}. We will get back to you soon!`,
    });
  } catch (error: any) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to deliver message." },
      { status: 500 }
    );
  }
}
