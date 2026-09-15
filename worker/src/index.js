// Hearth & Bean café assistant — serverless proxy to the OpenAI Responses API.
// Keeps the API key server-side; the static site (GitHub Pages) calls this
// Worker instead of OpenAI directly.

const SYSTEM_PROMPT = `You are the friendly virtual assistant for Hearth & Bean, a neighborhood café. Answer ONLY using the facts below. Keep replies short (2-4 sentences), warm, and conversational — like a helpful barista, not a corporate bot. Do not use markdown formatting or HTML tags; plain text only.

CAFÉ FACTS
- Hours: Monday–Friday 7:00am–6:00pm, Saturday 8:00am–6:00pm, Sunday 8:00am–4:00pm. Holiday hours: 9:00am–2:00pm.
- Menu highlights: Classic Latte $4.50, Pour Over $5.00, Iced Cortado $4.75, Butter Croissant $3.25, Cinnamon Bun $4.00, Avocado Toast $8.50. The full menu is on the website's Menu section.
- Location: 128 Maple Street, Portland, OR 97205.
- Wi-Fi: free Wi-Fi, laptop-friendly tables.
- Parking: free lot behind the building, plus metered street parking on Maple St.
- Dietary: oat and almond milk available for any drink; several menu items can be made vegetarian. For specific allergy questions, direct people to ask staff in person or use the Contact form.
- Contact: phone (503) 555-0148, email hello@hearthandbean.com, or the Contact form on the website.
- Ordering: this chat cannot take orders or reservations — direct people to order at the counter or use the "Order Now" button on the site.

If a question is unrelated to the café (general knowledge, coding, other topics), politely decline and steer the conversation back to how you can help with the café. If you don't know something specific (e.g. an allergen detail not listed above), say so honestly and point to the phone number or email rather than guessing.`;

const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY_TURNS = 8;

function corsHeaders(origin, allowedOrigin) {
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
  if (allowedOrigin === '*') {
    headers['Access-Control-Allow-Origin'] = '*';
  } else if (origin && origin === allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
  }
  return headers;
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

function extractOutputText(data) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }
  if (Array.isArray(data.output)) {
    const text = data.output
      .filter((item) => item.type === 'message')
      .flatMap((item) => item.content || [])
      .filter((part) => part.type === 'output_text')
      .map((part) => part.text)
      .join('\n')
      .trim();
    if (text) return text;
  }
  return '';
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowedOrigin = env.ALLOWED_ORIGIN || '*';
    const headers = corsHeaders(origin, allowedOrigin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/chat' || request.method !== 'POST') {
      return json({ error: 'Not found' }, 404, headers);
    }

    if (!headers['Access-Control-Allow-Origin']) {
      return json({ error: 'Origin not allowed' }, 403, headers);
    }

    if (!env.OPENAI_API_KEY) {
      return json({ error: 'Server is missing OPENAI_API_KEY' }, 500, headers);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400, headers);
    }

    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!message || message.length > MAX_MESSAGE_LENGTH) {
      return json({ error: `Message must be 1-${MAX_MESSAGE_LENGTH} characters` }, 400, headers);
    }

    const history = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY_TURNS) : [];
    const input = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history
        .filter(
          (turn) =>
            turn &&
            (turn.role === 'user' || turn.role === 'assistant') &&
            typeof turn.content === 'string'
        )
        .map((turn) => ({ role: turn.role, content: turn.content.slice(0, MAX_MESSAGE_LENGTH) })),
      { role: 'user', content: message },
    ];

    let openaiRes;
    try {
      openaiRes = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || 'gpt-4o-mini',
          input,
          max_output_tokens: 300,
          temperature: 0.4,
        }),
      });
    } catch (err) {
      return json({ error: 'Upstream request failed' }, 502, headers);
    }

    if (!openaiRes.ok) {
      const errText = await openaiRes.text().catch(() => '');
      console.error('OpenAI error', openaiRes.status, errText);
      return json({ error: 'AI service error' }, 502, headers);
    }

    const data = await openaiRes.json();
    const reply = extractOutputText(data);

    if (!reply) {
      return json({ error: 'Empty AI response' }, 502, headers);
    }

    return json({ reply }, 200, headers);
  },
};
