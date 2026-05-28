import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key')

export async function POST(req: NextRequest) {
  const { email, walletAddress } = await req.json()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  try {
    // Send confirmation email to subscriber
    await resend.emails.send({
      from: 'SynArc <onboarding@resend.dev>',
      to: email,
      subject: 'You are now subscribed to SynArc governance alerts',
      html: `
        <h2>Welcome to SynArc Governance Alerts 🏛</h2>
        <p>You will now receive email notifications when:</p>
        <ul>
          <li>New governance proposals are submitted</li>
          <li>Voting periods are ending soon</li>
          <li>Proposals are executed or defeated</li>
        </ul>
        <p><strong>Wallet:</strong> ${walletAddress || 'Not connected'}</p>
        <p>Visit <a href="https://www.synarcdao.xyz">synarcdao.xyz</a> to participate in governance.</p>
        <hr/>
        <small>Unsubscribe anytime from your Settings page.</small>
      `
    })

    // Notify you that someone subscribed
    await resend.emails.send({
      from: 'SynArc <onboarding@resend.dev>',
      to: 'devsynarc@gmail.com',
      subject: `New governance alert subscriber — ${email}`,
      html: `
        <p>New subscriber: <strong>${email}</strong></p>
        <p>Wallet: ${walletAddress || 'Not connected'}</p>
      `
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Subscription error:', error)
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}
