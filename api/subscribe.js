// api/subscribe.js
// Receives form submissions from the Mason landing page.
// Creates a contact in Resend (global), adds them to the Mason Subscribers segment,
// and fires the Make webhook that sends the welcome email.
//
// Env vars required (set in Vercel dashboard):
//   RESEND_API_KEY        — from Resend → API Keys (needs full access, not just sending)
//   RESEND_SEGMENT_ID     — c053a541-b54d-4ec0-8333-51185448c061
//   MAKE_WELCOME_WEBHOOK  — webhook URL from the "Mason — Welcome" Make scenario (we'll build next)

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
  const welcomeWebhook = process.env.MAKE_WELCOME_WEBHOOK;

  if (!apiKey || !segmentId) {
    console.error('Missing Resend credentials');
    return res.status(500).json({ error: 'Server config error' });
  }

  const cleanEmail = email.toLowerCase().trim();

  try {
    // Step 1: create the contact (global, not tied to a segment)
    const contactRes = await fetch('https://api.resend.com/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: cleanEmail,
        unsubscribed: false,
      }),
    });

    const contactData = await contactRes.json();

    // If contact already exists, Resend returns an error. Fetch the existing contact instead.
    let contactId = contactData?.id;
    if (!contactRes.ok) {
      if (contactData?.name === 'validation_error' || contactRes.status === 409) {
        const lookupRes = await fetch(`https://api.resend.com/contacts/${encodeURIComponent(cleanEmail)}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        const lookupData = await lookupRes.json();
        contactId = lookupData?.id;
      } else {
        console.error('Resend contact create error:', contactData);
        return res.status(contactRes.status).json({
          error: contactData?.message || 'Subscription failed',
        });
      }
    }

    // Step 2: add contact to Mason Subscribers segment
    if (contactId) {
      await fetch(`https://api.resend.com/contacts/${contactId}/segments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ segment_id: segmentId }),
      });
    }

    // Step 3: fire welcome email via Make webhook (don't block on failure)
    if (welcomeWebhook) {
      fetch(welcomeWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          role: role || '',
          size: size || '',
          industry: industry || '',
          country: country || '',
        }),
      }).catch(err => console.error('Welcome webhook error:', err));
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Subscribe error:', err);
    return res.status(500).json({ error: 'Network error, try again' });
  }
}
