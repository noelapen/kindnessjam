# Kindness Jam – Registration

A mobile-first React 18 and Vite registration frontend for Kindness Unlimited. The app uses a Google Apps Script web app as its API and Google Sheet as its data store.

## Requirements

- Node.js 18 or later and npm
- A deployed Google Apps Script web app implementing the API actions documented below

## Local setup

1. Create `.env` in the project root and set `VITE_API_URL` to the deployed Apps Script URL.
2. Install packages and start Vite:

   ```sh
   npm install
   npm run dev
   ```

3. Open the URL printed by Vite. Create a production build with `npm run build`.

The Apps Script deployment must allow the site to call it and return JSON responses with the shape `{ "ok": true, "data": ... }` or `{ "ok": false, "error": "..." }`. It is the interface between the app and the Google Sheet: organization details and registration records must be read from and written to the sheet by the Apps Script actions. The frontend does not keep a separate organization roster or registration dataset. POST requests send JSON in the body with `Content-Type: text/plain;charset=utf-8` to avoid a browser preflight request.

## Apps Script API contract

Implement these actions in the backend. Protected actions receive their admin key or organisation passcode in the POST body. Do not put credentials into the frontend source or deployment environment.

| Action | Parameters | Expected data |
| --- | --- | --- |
| `getOrgs` | — | Active organisations with `orgCode`, `orgName`, `type`, `quota`, `used`, `remaining`, `open` |
| `getOrg` | `orgCode` | One organisation with the fields above |
| `register` | `orgCode`, `name`, `phone`, `email` | `{ regNo, token, emailSent }`; atomically save the normalized email and send its confirmation |
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
| `resendTicketEmail` | `adminKey`, `regNo` | `{ sent: true }`; send again using the email saved in the registration row |

`register` must validate and normalize the email, sanitize the name and phone, enforce active status, registration deadline, per-organisation quota, duplicate phone prevention, and atomic quota accounting using Apps Script `LockService`. For every successful registration, the Apps Script service must assign a unique registration number and generate a separate unpredictable UUID token. QR verification sends the secret QR value using `token`. Manual scanner lookup first calls `lookupRegNo` to obtain the secret token, then calls `verify` with that token; registration numbers and QR tokens are different values.

The Apps Script implementation must save the email during `register`, send the confirmation only after appending the registration row, and return `emailSent` so the frontend can report delivery status. Its admin registration list should include the saved email so admins can retry delivery. `resendTicketEmail` must remain admin-protected and look up the email and ticket token from the sheet rather than accepting those values from the browser.

## Email delivery

The Apps Script sends through `MailApp.sendEmail()` using the Google account that executes the script. The website does not make a second SMTP/email-service request. After registration, the UI uses the `emailSent` value returned by Apps Script; administrators retry using the protected `resendTicketEmail` action.

To authorize mail sending, open the Apps Script project and run a mail authorization helper manually from the editor as the account that should send the messages. Accept Google's mail permission prompt. The supplied script's `testEmail()` calls the normal ticket sender with `row: 1`, which can overwrite the `EmailStatus` header; do not run that version. For a safe authorization check, temporarily use:

```js
function authorizeMail() {
  MailApp.sendEmail(
    Session.getActiveUser().getEmail(),
    'Kindness Jam mail authorization check',
    'Mail permission is authorized.'
  );
}
```

Run `authorizeMail` once and accept the prompt, then remove the helper if desired. Deploy the web app to **execute as the script owner** so registrants do not need to authorize mail themselves. Update the deployment to a new version after script changes. If the project has an explicit `appsscript.json` OAuth scope list, include the Apps Script send-mail scope (`https://www.googleapis.com/auth/script.send_mail`) alongside scopes required for its spreadsheet and URL-fetch operations.

Set `VITE_API_URL` in local `.env` and the frontend hosting build environment. No SMTP credentials, `REGISTRATION_API_URL`, or `VITE_EMAIL_API_URL` are needed for this Apps Script mail flow. Keep mail authorization in the script owner's account and do not ask registrants to authorize sending.

Test by registering with an email you can access, checking the `EmailStatus` cell for a `Sent ...` timestamp, and confirming the message arrived. If sending fails, the registration remains saved and `EmailStatus` records the failure; use **Resend email** in the admin registrations page after fixing authorization or the script. Run `npm run build` to validate frontend changes.

## Event and branding

- Update date, time, and venue in [`src/config/event.js`](src/config/event.js); this is the single event-details configuration file.
- The root URL (`/`) is the event-team admin sign-in. After signing in, use the dashboard's per-organisation **Copy link** action to share that organisation's separate `/r/{orgCode}` registration page.
- Add guest attraction images by placing image files in `public/` and adding entries such as `{ name: 'Guest performer', image: '/guest-performer.jpg' }` to `guestAttractions` in `src/config/event.js`. Until images are configured, registration pages show three branded image placeholders.
- The event-team dashboard's participant-sheet link is configured as `participantSheetUrl` in the same file. The linked Google Sheet must enforce its own access permissions.
- The volunteer registration dropdown is populated directly from the Apps Script `getOrgs` response, including organization names and quotas from the Google Sheet. Registrations, participant views, and registration totals are loaded through the Apps Script API; keep the sheet and Apps Script as the source of truth.
- The event logo shown in the header is `images/logo.png`.
- Update the palette and font in `tailwind.config.js` and `index.html` if the brand changes.

## Admin and privacy

- KU admin and NGO credentials are held in `sessionStorage` for the current browser tab. The admin key is sent only to Apps Script; it is not stored in source code.
- Public routes only call public API actions. Admin and NGO routes are protected in the frontend, and sensitive data must also be authorized by the backend on every request.
- Student ticket recovery currently uses the registered phone number via `findByPhone`; this is ticket recovery, not account authentication. The Apps Script backend must provide and enforce student authentication before this can be treated as a protected student account.
- The volunteer entry point currently uses the existing admin-key login. A separate volunteer role requires server-side authorization support in Apps Script; frontend route protection alone is not sufficient.
- NGOs receive their org code and passcode from the administrator. Treat these credentials as secrets.

## Deploy

Build the project with `npm run built` (or `npm run build`); both commands generate the `built` folder. Set `VITE_API_URL` in your hosting provider’s build environment and deploy `built`.

- **Netlify:** configure `VITE_API_URL` and publish the `built` folder. `public/_redirects` is copied into `built` by Vite to support React Router refresh/deep-link navigation.

## Commands

```sh
npm install
npm run dev
npm run built
```
