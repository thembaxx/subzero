# Trace

A personal digital-footprint app built in the empty `thembaxx/subzero` repository on the `themes` branch. The Trace brand includes an original fingerprint mark, Satoshi typography, warm neutral and lime colors, light/dark themes, a Three.js identity sculpture, and GSAP scroll animation.

## Run

Requires Node.js 24.5+ and pnpm 11.25.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000`. The complete interactive demo is at `/dashboard?demo=1`; no credentials are needed. It includes search, category and exposure filters, account details, review status, browser-local CSV import, and JSON report export.

`pnpm dev` and `pnpm build` download missing official Satoshi webfonts from Fontshare into ignored local assets. Font binaries are not redistributed in this repository. See `public/fonts/LICENSE.txt` and [Fontshare’s license](https://www.fontshare.com/licenses/itf-free-font-license). Subsequent builds reuse the downloaded files. Browser page loads use self-hosted fonts without contacting Fontshare.

## Enable real verification and discovery

Copy `.env.example` to `.env.local`. The app intentionally never pretends to send a link, verify an OTP, or find personal accounts when providers are not configured.

| Variable                               | Purpose                                                            |
| -------------------------------------- | ------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase project URL                                               |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase public publishable key; never use a service-role key here |
| `HIBP_API_KEY`                         | Optional server-only Have I Been Pwned subscription API key        |

Configure the Supabase project:

1. Enable email sign-in with confirmation. Configure a production SMTP sender for magic links and keep the PKCE-compatible `ConfirmationURL` email template. Add `http://localhost:3000/auth/callback` and the production `/auth/callback` URL to the redirect allowlist; set the production Site URL.
2. Enable phone authentication and configure an SMS provider. Trace accepts international numbers with a searchable country-code selector and verifies real SMS OTPs through Supabase. Phone verification alone does **not** search email or phone breach records.
3. Enable Google OAuth with your own Google Cloud OAuth credentials. Add the Supabase callback URL (`https://<project>.supabase.co/auth/v1/callback`) to the Google client’s authorized redirect URIs. Basic Google sign-in requests identity access only.
4. To enable inbox discovery, enable the Gmail API in the Google Cloud project and configure the OAuth consent screen for `https://www.googleapis.com/auth/gmail.readonly`. Google classifies this as a restricted scope; use explicit test users during development and complete Google’s required verification before public use. Trace requests it only after the user chooses to connect an inbox and accepts the in-app permission explanation.
5. Add `HIBP_API_KEY` for email breach discovery. Follow the subscription’s rate and use limits. Errors and unavailable sources are shown explicitly in Connections.

Restart the dev server after changing public variables. Public Supabase configuration is embedded at build time, so rebuild production after changes. Never commit credentials.

### Google OAuth readiness

The public `/api/auth/providers` endpoint reads enabled sign-in methods from Supabase.
It shows Google and phone options only when their providers report enabled.
`GOOGLE_OAUTH_READY=false` is an optional, server-only deployment variable
that hides Google even if Supabase marks it enabled; use this when Google's
OAuth page returns `401 invalid_client` because the registered client is missing.
After configuring a valid **Web application** OAuth client in Google Cloud
and updating Supabase Authentication → Providers → Google, change the
variable to `true` (or remove it), redeploy, and verify the full sign-in flow.
Do not add OAuth client secrets to source control or browser environment variables.

## What discovery can establish

- **Connected Gmail:** the provider token’s inbox must match the server-verified email. The app reads sender metadata from up to 24 matching welcome/verification emails in batches of four. Results are **possible** accounts; they do not confirm an account remains active. Message bodies are not fetched. Google grants broader read-only mailbox permission, as disclosed before consent. Expired provider tokens require reconnecting.
- **Known breaches:** Have I Been Pwned is queried only for the email derived from the verified server session. Responses contain historic breach evidence and data categories, not confirmation of a current account. No match does not prove no exposure.
- **Local CSV:** supports `url`, `website`, `login_uri`, `login uri`, and `login_url` columns, including common password-manager exports. Only website domains are retained. Passwords, usernames, notes, and URL credentials are discarded. Files are limited to 2 MB / 1,000 rows and never uploaded.
- **Demo:** all initial results and exposures are sample data. Refreshing the demo never performs a personal lookup.

The discovery endpoint accepts no target identity from the request. Both dashboard and API handlers independently validate the Supabase user and confirmed identity. The Next.js proxy refreshes session cookies; it is not the authorization layer. No application database stores scan results. Results and review marks last for the current page visit. Theme preference is persistent; downloaded reports are user-controlled local files.

## PWA and accessibility

Production includes a web app manifest, standard and maskable icons, an install action, and a service worker. Offline navigation shows a public fallback. The worker caches only that fallback and public icons; dashboard, API, and authentication responses are never cached. Installation requires HTTPS, except on localhost.

Layouts support mobile, tablet, and desktop. Native dialogs manage focus and Escape dismissal; the country selector supports search and keyboard navigation. `prefers-reduced-motion` disables decorative motion. The Three.js renderer handles unavailable WebGL, disposes resources, and pauses animation outside the viewport or when the page is hidden.

## Checks

```sh
pnpm format:check
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Browser tests cover the main user flow, responsive widths, theme persistence, ownership gates, import privacy, export, and the production offline cache:

```sh
pnpm exec playwright install chromium
pnpm test:e2e
```

For an existing system Chromium, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`. Browser tests assume no live authentication configuration and make no real personal lookups. Actual email/SMS delivery and Google/HIBP authorization need valid provider credentials and must be checked in the configured deployment.

## Deployment

Deploy as a standard Next.js app using `pnpm build` and `pnpm start`, with Node.js 24.5+, HTTPS, and the environment variables above. Configure Supabase/Google redirects for the final domain. There is no static export because identity verification and discovery run on the server.

The app does not enumerate third-party login forms, close accounts, send deletion requests, or claim to find every account. Users manage accounts directly with each service.
