import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = "hello@syndaopro.xyz";

export async function POST(req: NextRequest) {
  try {
    const { email, walletAddress, source } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const originSource = source || "Autonomous Governance Dispatches";
    const timestamp = new Date().toUTCString();

    if (!apiKey || apiKey === "re_mock_key") {
      console.warn("RESEND_API_KEY not configured. Simulating newsletter subscription notification.");
      console.log(`[NEWSLETTER SUBSCRIBE] Email: ${email} | Wallet: ${walletAddress || "N/A"} | Admin Target: ${ADMIN_EMAIL}`);
      return NextResponse.json({
        success: true,
        simulated: true,
        message: `Subscription registered. Updates forwarded to ${ADMIN_EMAIL}.`,
      });
    }

    const resend = new Resend(apiKey);

    // 1. Send alert notification to hello@syndaopro.xyz
    await resend.emails.send({
      from: "Syn DAO Dispatches <onboarding@resend.dev>",
      to: ADMIN_EMAIL,
      subject: `[Syn DAO] New Dispatch & Governance Subscriber: ${email}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0D14; color: #F5F7FA; border-radius: 12px; border: 1px solid #1E293B; overflow: hidden; padding: 24px;">
          <div style="border-bottom: 1px solid #1E293B; padding-bottom: 16px; margin-bottom: 20px;">
            <span style="font-family: monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #2F6FFF; background: rgba(47,111,255,0.15); border: 1px solid rgba(47,111,255,0.3); padding: 4px 10px; border-radius: 9999px;">
              New Subscriber Alert
            </span>
            <h2 style="font-size: 20px; font-weight: 700; margin-top: 12px; margin-bottom: 4px; color: #FFFFFF;">
              New Governance Dispatch Subscriber
            </h2>
            <p style="font-size: 13px; color: #94A3B8; margin: 0;">
              A new user requested on-chain intelligence updates from the Syn DAO portal.
            </p>
          </div>

          <div style="background: #111827; border: 1px solid #1F2937; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #94A3B8; width: 140px; font-family: monospace; font-size: 12px;">SUBSCRIBER EMAIL</td>
                <td style="padding: 6px 0; font-weight: 600; color: #60A5FA;">
                  <a href="mailto:${email}" style="color: #60A5FA; text-decoration: none;">${email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94A3B8; font-family: monospace; font-size: 12px;">WALLET ADDRESS</td>
                <td style="padding: 6px 0; font-family: monospace; color: #E2E8F0; word-break: break-all;">
                  ${walletAddress || "Not connected"}
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94A3B8; font-family: monospace; font-size: 12px;">SOURCE LOCATION</td>
                <td style="padding: 6px 0; color: #CBD5E1;">${originSource}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94A3B8; font-family: monospace; font-size: 12px;">TIMESTAMP</td>
                <td style="padding: 6px 0; font-family: monospace; color: #94A3B8; font-size: 12px;">${timestamp}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 12px; color: #64748B; margin: 0; border-top: 1px solid #1E293B; padding-top: 14px;">
            Sent automatically by the Syn DAO Protocol engine to <code>${ADMIN_EMAIL}</code>.
          </p>
        </div>
      `,
    });

    // 2. Safely attempt to send confirmation welcome email to subscriber
    // (isolated in try/catch so unverified Resend sandbox domains won't break admin alerts)
    try {
      await resend.emails.send({
        from: "Syn DAO <onboarding@resend.dev>",
        to: email,
        subject: "You are now subscribed to Syn DAO governance dispatches",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0D14; color: #F5F7FA; border-radius: 12px; border: 1px solid #1E293B; overflow: hidden; padding: 24px;">
            <h2 style="color: #FFFFFF; font-size: 22px;">Welcome to Syn DAO Dispatches</h2>
            <p style="color: #94A3B8; font-size: 14px; line-height: 1.6;">
              You will now receive weekly intelligence on AI verifier milestones, Circle CCTP rebalances, and verified deliverable payouts across the Arc ecosystem.
            </p>
            <div style="margin: 20px 0; padding: 14px; background: #111827; border-radius: 8px; border: 1px solid #1F2937;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #60A5FA;"><strong>What to expect:</strong></p>
              <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #94A3B8; line-height: 1.8;">
                <li>New governance proposals & voting windows</li>
                <li>48h timelock status updates</li>
                <li>AI verifier agent releases & SDK guides</li>
              </ul>
            </div>
            <p style="font-size: 12px; color: #64748B;">
              If you have any questions or feedback, reach our core team directly at <a href="mailto:${ADMIN_EMAIL}" style="color: #60A5FA;">${ADMIN_EMAIL}</a>.
            </p>
          </div>
        `,
      });
    } catch (subscriberEmailErr) {
      // In Resend sandbox mode, sending to unverified addresses might be restricted.
      console.warn("Subscriber confirmation email omitted or restricted:", subscriberEmailErr);
    }

    return NextResponse.json({ success: true, message: `Subscribed successfully! Notification sent to ${ADMIN_EMAIL}.` });
  } catch (error: any) {
    console.error("Subscription route error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to subscribe to updates" },
      { status: 500 }
    );
  }
}
