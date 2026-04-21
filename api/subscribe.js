// api/subscribe.js
// Receives form submissions from the Mason landing page.
// Creates a contact in Resend segment + sends welcome email. Direct Resend calls, no Make.

const WELCOME_HTML = "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">\n<html xmlns=\"http://www.w3.org/1999/xhtml\" lang=\"en\">\n<head>\n<meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\" />\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n<meta name=\"x-apple-disable-message-reformatting\" />\n<meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\" />\n<meta name=\"color-scheme\" content=\"light only\" />\n<meta name=\"supported-color-schemes\" content=\"light only\" />\n<title>You're in. First issue lands soon.</title>\n<style type=\"text/css\">\n@import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;700&display=swap');\nbody, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }\ntable, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }\nimg { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }\nbody { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #EEE7D2 !important; }\ntable { border-collapse: collapse; }\n@media only screen and (max-width: 600px) {\n  .container { width: 100% !important; }\n  .padding-outer { padding-left: 24px !important; padding-right: 24px !important; }\n  .headline { font-size: 30px !important; line-height: 1.15 !important; }\n}\n</style>\n</head>\n<body style=\"margin:0;padding:0;background-color:#EEE7D2;font-family:'Geist','Helvetica Neue',Arial,sans-serif;\">\n<div style=\"background-color:#EEE7D2;background-image:radial-gradient(circle at 1px 1px, rgba(10,10,10,0.08) 1px, transparent 0);background-size:16px 16px;padding:40px 0;\">\n<table role=\"presentation\" class=\"container\" width=\"600\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" align=\"center\" style=\"width:600px;max-width:600px;background-color:#EEE7D2;\">\n\n<!-- Masthead -->\n<tr>\n<td class=\"padding-outer\" style=\"padding:0 40px;\">\n<table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">\n<tr>\n<td style=\"background:#0A0A0A;padding:28px 32px;border-left:6px solid #C64728;\">\n<table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">\n<tr>\n<td style=\"font-family:'Geist','Helvetica Neue',Arial,sans-serif;font-size:28px;font-weight:700;letter-spacing:-0.02em;color:#FAFAF7;\">Mason<span style=\"color:#C64728;\">.</span></td>\n<td align=\"right\" style=\"font-family:'Geist Mono','JetBrains Mono',monospace;font-size:10px;color:#C64728;letter-spacing:0.25em;text-transform:uppercase;font-weight:700;\">Welcome</td>\n</tr>\n</table>\n</td>\n</tr>\n</table>\n</td>\n</tr>\n\n<!-- Spacer -->\n<tr><td style=\"height:48px;line-height:48px;\">&nbsp;</td></tr>\n\n<!-- Label -->\n<tr>\n<td class=\"padding-outer\" style=\"padding:0 40px;\">\n<div style=\"font-family:'Geist Mono','JetBrains Mono',monospace;font-size:10px;color:#C64728;letter-spacing:0.3em;text-transform:uppercase;font-weight:700;margin-bottom:20px;\">You're on the list</div>\n</td>\n</tr>\n\n<!-- Headline -->\n<tr>\n<td class=\"padding-outer\" style=\"padding:0 40px;\">\n<h1 class=\"headline\" style=\"font-family:'Geist','Helvetica Neue',Arial,sans-serif;font-size:38px;line-height:1.1;letter-spacing:-0.025em;color:#0A0A0A;font-weight:700;margin:0 0 24px 0;\">You're in. First issue lands soon.</h1>\n</td>\n</tr>\n\n<!-- Body -->\n<tr>\n<td class=\"padding-outer\" style=\"padding:0 40px;\">\n<div style=\"font-family:'Geist','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.65;color:#0A0A0A;font-weight:400;\">\n\n<p style=\"margin:0 0 20px 0;\">Glad you're here. You'll get two emails a week \u2014 that's it.</p>\n\n<p style=\"margin:0 0 20px 0;\"><strong style=\"color:#0A0A0A;\">Monday \u00b7 The Build.</strong> One AI system, shown end-to-end. The story, the stack, the prompt, what broke. Named builders, real sources, honest failure modes.</p>\n\n<p style=\"margin:0 0 20px 0;\"><strong style=\"color:#0A0A0A;\">Thursday \u00b7 The Move.</strong> One pattern worth stealing. The architectural shift, not the tool launch. When to make the move, when not to.</p>\n\n<p style=\"margin:0 0 20px 0;\">No press releases. No listicles. No \"this changes everything.\" Just real people, real systems, real detail \u2014 twice a week.</p>\n\n<p style=\"margin:0 0 20px 0;\">You'll leave every issue with one concrete thing you didn't know before. If we ever ship an issue that doesn't do that, we skip the day instead.</p>\n\n<p style=\"margin:0 0 20px 0;\">First issue lands soon. Reply to this email if there's something specific you're trying to build \u2014 it helps sharpen what we write.</p>\n\n<p style=\"margin:32px 0 0 0;font-family:'Geist Mono','JetBrains Mono',monospace;font-size:12px;color:#0A0A0A;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;\">\u2014 Mason</p>\n\n</div>\n</td>\n</tr>\n\n<!-- Spacer -->\n<tr><td style=\"height:56px;line-height:56px;\">&nbsp;</td></tr>\n\n<!-- Footer -->\n<tr>\n<td class=\"padding-outer\" style=\"padding:0 40px 40px 40px;border-top:1px solid rgba(10,10,10,0.12);padding-top:24px;\">\n<div style=\"font-family:'Geist Mono','JetBrains Mono',monospace;font-size:10px;color:#666;letter-spacing:0.15em;line-height:1.8;text-transform:uppercase;\">\nYou're receiving this because you signed up at readmason.com.<br/>\n<a href=\"{{{RESEND_UNSUBSCRIBE_URL}}}\" style=\"color:#666;border-bottom:1px solid #999;text-decoration:none;\">Unsubscribe</a> &nbsp;\u00b7&nbsp; <a href=\"https://readmason.com\" style=\"color:#666;border-bottom:1px solid #999;text-decoration:none;\">readmason.com</a>\n</div>\n</td>\n</tr>\n\n</table>\n</div>\n</body>\n</html>\n";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, role, size, industry, country } = req.body || {};

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const segmentId = process.env.RESEND_SEGMENT_ID;

  if (!apiKey || !segmentId) {
    console.error('Missing Resend credentials');
    return res.status(500).json({ error: 'Server config error' });
  }

  const cleanEmail = email.toLowerCase().trim();

  try {
    // Step 1: Create contact in Mason Subscribers segment
    const contactRes = await fetch('https://api.resend.com/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: cleanEmail,
        unsubscribed: false,
        segments: [{ id: segmentId }],
      }),
    });

    if (!contactRes.ok) {
      const err = await contactRes.json();
      console.error('Resend contact create error:', err);
      // Don't fail form — contact may already exist
    }

    // Step 2: Send welcome email
    try {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Mason <newsletter@readmason.com>',
          to: [cleanEmail],
          reply_to: 'ccst.260430@gmail.com',
          subject: "You're in. First issue lands soon.",
          html: WELCOME_HTML,
        }),
      });
      if (!emailRes.ok) {
        const err = await emailRes.json();
        console.error('Resend welcome send error:', err);
      }
    } catch (err) {
      console.error('Welcome email send failed:', err);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Subscribe error:', err);
    return res.status(500).json({ error: 'Network error, try again' });
  }
}
