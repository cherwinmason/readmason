// api/subscribe.js
// Receives form submissions from the Mason landing page.
// Creates a contact in Resend and adds them to the Mason Subscribers segment in one call.
// Fires the Make webhook that sends the welcome email.

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
    // Create contact with segment assignment in one call
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

    const contactData = await contactRes.json();

    // If contact already exists, update to add to segment
    if (!contactRes.ok) {
      console.error('Resend contact create error:', contactData);
      // Don't fail the form — contact may already exist
    }

    // Fire welcome email via Make webhook (non-blocking)
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
