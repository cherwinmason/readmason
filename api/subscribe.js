// api/subscribe.js
// Receives form submissions from the Mason landing page and creates
// a subscriber in Beehiiv with custom fields.
//
// Env vars required (set in Vercel dashboard):
//   BEEHIIV_API_KEY   — from Beehiiv → Settings → Integrations → API
//   BEEHIIV_PUB_ID    — looks like "pub_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, role, size, industry, country } = req.body || {};

  // Basic validation
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const apiKey = process.env.BEEHIIV_API_KEY;
  const pubId  = process.env.BEEHIIV_PUB_ID;

  if (!apiKey || !pubId) {
    console.error('Missing Beehiiv credentials');
    return res.status(500).json({ error: 'Server config error' });
  }

  // Beehiiv's subscription create endpoint
  const url = `https://api.beehiiv.com/v2/publications/${pubId}/subscriptions`;

  // Build the payload — Beehiiv supports custom fields via `custom_fields` array
  const payload = {
    email: email.toLowerCase().trim(),
    reactivate_existing: false,
    send_welcome_email: true,
    utm_source: 'readmason_landing',
    utm_medium: 'organic',
    utm_campaign: 'launch',
    custom_fields: [
      role      ? { name: 'Role',         value: role }     : null,
      size      ? { name: 'Company Size', value: size }     : null,
      industry  ? { name: 'Industry',     value: industry } : null,
      country   ? { name: 'Country (self-reported)', value: country } : null,
    ].filter(Boolean),
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Beehiiv error:', data);
      return res.status(response.status).json({
        error: data.errors?.[0]?.message || 'Subscription failed',
      });
    }

    return res.status(200).json({ ok: true, id: data.data?.id });
  } catch (err) {
    console.error('Fetch error:', err);
    return res.status(500).json({ error: 'Network error, try again' });
  }
}
