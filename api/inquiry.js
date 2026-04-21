// Vercel serverless function: /api/inquiry
// Handles consultation inquiries from readmason.com/build
// 1. Sends notification email to newsletter@readmason.com
// 2. If newsletter_optin=true, creates contact in Resend Mason Subscribers segment
// 3. Sends confirmation email to inquirer
//
// Required environment variables (set in Vercel dashboard):
//   - RESEND_API_KEY     (already set for newsletter)
//   - RESEND_SEGMENT_ID  (already set for newsletter)
//
// Note: Captcha is intentionally omitted. Add Cloudflare Turnstile later if spam becomes an issue.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    name,
    email,
    company,
    size,
    what,
    tried,
    budget,
    timeline,
    newsletter_optin,
    source,
    submitted_at,
  } = req.body || {};

  // ─────────────────────────────────────────────────────────
  // 1. Basic validation
  // ─────────────────────────────────────────────────────────
  if (!name || !email || !company || !size || !what) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const optedIn = newsletter_optin === true;

  // ─────────────────────────────────────────────────────────
  // 2. Build notification email (sent to you)
  // ─────────────────────────────────────────────────────────
  const notificationHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Geist',sans-serif;background:#F5F1E8;padding:40px 20px;margin:0;">
  <div style="max-width:640px;margin:0 auto;background:#FAFAF7;border:2px solid #0A0A0A;padding:40px;">
    <div style="font-family:monospace;font-size:11px;font-weight:700;color:#C64728;letter-spacing:0.3em;text-transform:uppercase;margin-bottom:16px;">▎ New inquiry</div>
    <h1 style="font-size:28px;font-weight:700;color:#0A0A0A;margin:0 0 8px 0;letter-spacing:-0.025em;">${escapeHtml(name)}</h1>
    <div style="font-size:15px;color:#6B6B6B;margin-bottom:32px;">
      <strong>${escapeHtml(company)}</strong> · ${escapeHtml(size)} · <a href="mailto:${escapeHtml(email)}" style="color:#C64728;">${escapeHtml(email)}</a>
    </div>

    <div style="border-top:1px solid rgba(10,10,10,0.12);padding-top:24px;margin-bottom:24px;">
      <div style="font-family:monospace;font-size:10px;font-weight:700;color:#C64728;letter-spacing:0.25em;text-transform:uppercase;margin-bottom:8px;">What they want to build</div>
      <div style="font-size:16px;line-height:1.6;color:#0A0A0A;white-space:pre-wrap;">${escapeHtml(what)}</div>
    </div>

    ${tried ? `
    <div style="border-top:1px solid rgba(10,10,10,0.12);padding-top:24px;margin-bottom:24px;">
      <div style="font-family:monospace;font-size:10px;font-weight:700;color:#C64728;letter-spacing:0.25em;text-transform:uppercase;margin-bottom:8px;">What they've tried</div>
      <div style="font-size:15px;line-height:1.6;color:#3F3F3F;white-space:pre-wrap;">${escapeHtml(tried)}</div>
    </div>
    ` : ''}

    <div style="border-top:1px solid rgba(10,10,10,0.12);padding-top:24px;display:flex;gap:32px;flex-wrap:wrap;">
      <div>
        <div style="font-family:monospace;font-size:10px;font-weight:700;color:#6B6B6B;letter-spacing:0.15em;text-transform:uppercase;">Budget</div>
        <div style="font-size:14px;color:#0A0A0A;font-weight:600;">${escapeHtml(budget || 'Not specified')}</div>
      </div>
      <div>
        <div style="font-family:monospace;font-size:10px;font-weight:700;color:#6B6B6B;letter-spacing:0.15em;text-transform:uppercase;">Timeline</div>
        <div style="font-size:14px;color:#0A0A0A;font-weight:600;">${escapeHtml(timeline || 'Not specified')}</div>
      </div>
      <div>
        <div style="font-family:monospace;font-size:10px;font-weight:700;color:#6B6B6B;letter-spacing:0.15em;text-transform:uppercase;">Newsletter</div>
        <div style="font-size:14px;color:${optedIn ? '#0A7A3F' : '#6B6B6B'};font-weight:600;">${optedIn ? 'Subscribed ✓' : 'Not subscribed'}</div>
      </div>
    </div>

    <div style="margin-top:40px;padding-top:24px;border-top:4px solid #C64728;">
      <a href="mailto:${escapeHtml(email)}?subject=Re: Your inquiry about ${encodeURIComponent(what.slice(0, 60))}" style="display:inline-block;background:#C64728;color:#FAFAF7;padding:14px 24px;font-weight:700;text-decoration:none;letter-spacing:-0.005em;">Reply to ${escapeHtml(name)} →</a>
    </div>

    <div style="margin-top:32px;font-family:monospace;font-size:10px;color:#B8B5AB;letter-spacing:0.1em;">
      Source: ${escapeHtml(source || 'unknown')}<br/>
      Submitted: ${escapeHtml(submitted_at || new Date().toISOString())}
    </div>
  </div>
</body>
</html>
  `.trim();

  // ─────────────────────────────────────────────────────────
  // 3. Send via Resend
  // ─────────────────────────────────────────────────────────
  const resendApiKey = process.env.RESEND_API_KEY;
  const segmentId = process.env.RESEND_SEGMENT_ID;
  if (!resendApiKey) {
    console.error('Missing RESEND_API_KEY environment variable');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // 3a. Notification email to you
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Mason <newsletter@readmason.com>',
        to: ['newsletter@readmason.com'],
        reply_to: cleanEmail,
        subject: `New build inquiry: ${name} (${company})`,
        html: notificationHtml,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error('Resend notification error:', errText);
      return res.status(500).json({ error: 'Failed to send notification' });
    }

    // 3b. If opted in, create contact in Mason Subscribers segment
    // Failures here do NOT block the form success — inquiry still goes through
    if (optedIn && segmentId) {
      try {
        const contactRes = await fetch('https://api.resend.com/contacts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: cleanEmail,
            unsubscribed: false,
            segments: [{ id: segmentId }],
            properties: {
              name: name || '',
              company: company || '',
              company_size: size || '',
              source: 'build-form',
            },
          }),
        });

        if (!contactRes.ok) {
          const err = await contactRes.json();
          console.error('Resend contact create error (non-blocking):', err);
        }
      } catch (err) {
        console.error('Contact create failed (non-blocking):', err);
      }
    } else if (optedIn && !segmentId) {
      console.error('newsletter_optin=true but RESEND_SEGMENT_ID missing');
    }

    // 3c. Confirmation email to the inquirer
    const newsletterLine = optedIn
      ? `<p style="font-size:16px;line-height:1.6;color:#3F3F3F;margin:0 0 16px 0;">We've also added you to <strong>Mason</strong> — one build Monday, one move Thursday. First issue lands soon.</p>`
      : '';

    const confirmHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="font-family:-apple-system,'Geist',sans-serif;background:#EEE7D2;padding:40px 20px;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#F5F1E8;padding:40px;">
    <div style="font-size:24px;font-weight:800;color:#0A0A0A;letter-spacing:-0.03em;margin-bottom:32px;">Mason<span style="color:#C64728;">.</span></div>

    <h1 style="font-size:28px;font-weight:500;color:#0A0A0A;letter-spacing:-0.025em;line-height:1.15;margin:0 0 20px 0;">Got it, ${escapeHtml(name.split(' ')[0])}.</h1>

    <p style="font-size:16px;line-height:1.6;color:#3F3F3F;margin:0 0 16px 0;">We received your inquiry and a real person will read it within 48 hours — usually faster.</p>

    <p style="font-size:16px;line-height:1.6;color:#3F3F3F;margin:0 0 16px 0;">If what you described is a fit, we'll reply with a consult booking link. If it isn't, we'll tell you why and point you somewhere that is.</p>

    <p style="font-size:16px;line-height:1.6;color:#3F3F3F;margin:0 0 32px 0;">Either way — you'll hear back.</p>

    ${newsletterLine}

    <div style="border-top:1px solid rgba(10,10,10,0.15);padding-top:24px;margin-top:24px;">
      <p style="font-size:14px;color:#6B6B6B;margin:0;">— Mason team</p>
    </div>

    <div style="margin-top:48px;font-family:monospace;font-size:11px;color:#B8B5AB;letter-spacing:0.05em;">
      readmason.com · Singapore
    </div>
  </div>
</body>
</html>
    `.trim();

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Mason <newsletter@readmason.com>',
        to: [cleanEmail],
        subject: `Got it — we'll reply within 48h`,
        html: confirmHtml,
      }),
    });

    return res.status(200).json({ success: true, subscribed: optedIn });
  } catch (err) {
    console.error('Inquiry submit error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
