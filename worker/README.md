# Hearth & Bean chat backend

A small Cloudflare Worker that proxies chat messages to the OpenAI Responses
API. It exists because GitHub Pages only serves static files — it can't hold
a secret API key — so the browser talks to this Worker instead, and the
Worker holds the key server-side.

The site's chat widget ([../script.js](../script.js)) calls this Worker first
and automatically falls back to its built-in rule-based answers if the
Worker is unreachable, misconfigured, or not deployed yet — the site works
fine without this piece.

## One-time setup

1. Install dependencies:
   ```bash
   cd worker
   npm install
   ```
2. Log in to Cloudflare (opens a browser window):
   ```bash
   npx wrangler login
   ```
3. Get an OpenAI API key from https://platform.openai.com/api-keys, then set
   it as a Worker secret (you'll be prompted to paste it — it is never
   written to a file or committed):
   ```bash
   npx wrangler secret put OPENAI_API_KEY
   ```
4. Deploy:
   ```bash
   npx wrangler deploy
   ```
   This prints your Worker's URL, e.g.
   `https://hearth-bean-chat.<your-subdomain>.workers.dev`.

## Wire up the frontend

Open [../index.html](../index.html) and find the `chatPanel` section. Set
`data-chat-endpoint` to your deployed URL with `/chat` appended:

```html
<section class="chat-panel" id="chatPanel" ...
  data-chat-endpoint="https://hearth-bean-chat.<your-subdomain>.workers.dev/chat">
```

Commit and push — GitHub Pages will pick it up on the next deploy.

## Lock down CORS (recommended before going live)

By default `wrangler.toml` sets `ALLOWED_ORIGIN = "*"`, which lets any site
call your Worker (and spend your OpenAI credits). Once you know your GitHub
Pages URL, restrict it:

```toml
[vars]
ALLOWED_ORIGIN = "https://<your-username>.github.io"
```

Then redeploy with `npx wrangler deploy`.

## Local development

```bash
cp .dev.vars.example .dev.vars
# edit .dev.vars and paste a real key (this file is gitignored)
npm run dev
```

This starts the Worker on `http://localhost:8787`. Point
`data-chat-endpoint` at `http://localhost:8787/chat` while testing locally,
then switch it back to the deployed URL before committing.

## Notes

- Model defaults to `gpt-4o-mini` via the `OPENAI_MODEL` var in
  `wrangler.toml` — change it to any Responses API–compatible model you have
  access to.
- The Worker caps messages at 500 characters and keeps only the last 8
  turns of conversation history to bound cost per request.
- The system prompt (in `src/index.js`) grounds every answer in the same
  café facts (hours, menu, address, etc.) used by the local fallback, and
  instructs the model to decline off-topic questions and avoid guessing at
  facts it wasn't given.
