# Kindness Jam – Registration

A mobile-first React 18 and Vite registration frontend for Kindness Unlimited. The app uses a Google Apps Script web app as its API and Google Sheet as its data store.

## Requirements

- Node.js 18 or later and npm
- A deployed Google Apps Script web app implementing the API actions documented below

## Local setup

1. Copy `.env.example` to `.env` and set `VITE_API_URL` to the deployed Apps Script web app URL.
2. Install packages and start Vite:

   ```sh
   npm install
   npm run dev
   ```

3. Open the URL printed by Vite. Create a production build with `npm run build`.

The Apps Script deployment must allow the site to call it and return JSON responses with the shape `{ "ok": true, "data": ... }` or `{ "ok": false, "error": "..." }`. POST requests send JSON in the body with `Content-Type: text/plain;charset=utf-8` to avoid a browser preflight request.

## Apps Script API contract

Implement these actions in the backend. Protected actions receive their admin key or organisation passcode in the POST body. Do not put credentials into the frontend source or deployment environment.

| Action | Parameters | Expected data |
| --- | --- | --- |
| `getOrgs` | — | Active organisations with `orgCode`, `orgName`, `type`, `quota`, `used`, `remaining`, `open` |
| `getOrg` | `orgCode` | One organisation with the fields above |
| `register` | `orgCode`, `name`, `phone`, `email` | `{ regNo, token }` |
| `getTicket` | `token` | `{ regNo, name, orgName, checkedIn, checkedInAt }` |
| `findByPhone` | `phone` | `{ token }` |
| `adminLogin` | `adminKey` | `{ ok }` |
| `ngoLogin` | `orgCode`, `passcode` | `{ ok }` |
| `adminSummary` | `adminKey` | `{ orgs, totals }` |
| `adminOrgRegistrations` | `adminKey`, `orgCode` | Registrations array |
| `ngoRegistrations` | `orgCode`, `passcode` | Only that organisation’s registrations, preferably with quota/used/remaining metadata |
| `updateOrg` | `adminKey`, `orgCode`, `quota`, `deadline`, `active` | Success response |
| `addOrg` | `adminKey`, `orgName`, `type`, `quota`, `deadline` | Success response, preferably including generated `orgCode` and `passcode` |
| `verify` | `adminKey`, `token` | `{ status, name, orgName, regNo, checkedInAt }`, where status is `ALLOWED`, `USED`, or `INVALID` |
| `lookupRegNo` | `adminKey`, `regNo` | `{ token }` for the matching registration |

`register` must enforce active status, registration deadline, per-organisation quota, duplicate phone prevention, and atomic quota accounting using Apps Script `LockService`. The Apps Script service must generate an unpredictable UUID token for every successful registration. QR verification sends the secret QR value using `token`. Manual scanner lookup first calls `lookupRegNo` to obtain the secret token, then calls `verify` with that token; registration numbers and QR tokens are different values.

## Event and branding

- Update date, time, and venue in [`src/config/event.js`](src/config/event.js); this is the single event-details configuration file.
- Replace the marked text placeholder in the header with the official logo when available. The asset drop location is [`src/assets/`](src/assets/).
- Update the palette and font in `tailwind.config.js` and `index.html` if the brand changes.

## Admin and privacy

- KU admin and NGO credentials are held in `sessionStorage` for the current browser tab. The admin key is sent only to Apps Script; it is not stored in source code.
- Public routes only call public API actions. Admin and NGO routes are protected in the frontend, and sensitive data must also be authorized by the backend on every request.
- NGOs receive their org code and passcode from the administrator. Treat these credentials as secrets.

## Deploy

Build the project with `npm run build`, set `VITE_API_URL` in your hosting provider’s build environment, and deploy the generated `dist` folder.

- **Vercel:** import the project, configure the `VITE_API_URL` environment variable, and deploy. `vercel.json` rewrites application routes to Vite’s entry point for refresh/deep-link support.
- **Netlify:** deploy `dist`, configure `VITE_API_URL`, and use `public/_redirects` (copied into `dist` by Vite) for React Router refresh/deep-link support.

## Commands

```sh
npm install
npm run dev
npm run build
```
