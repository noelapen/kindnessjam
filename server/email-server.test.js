import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import express from 'express'
import { createServer } from 'node:http'
import QRCode from 'qrcode'
import { after, test } from 'node:test'
import { createEmailApp, isValidEmail } from './email-server.js'

const servers = new Set()

after(async () => {
  await Promise.all([...servers].map((server) => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve())
  })))
})

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  servers.add(server)
  return `http://127.0.0.1:${server.address().port}`
}

async function createHarness(ticket, sendMail) {
  const lookupApp = express()
  lookupApp.use(express.text({ type: 'text/plain' }))
  let lookups = 0
  lookupApp.post('/', (req, res) => {
    lookups += 1
    const { action, token } = JSON.parse(req.body)
    assert.equal(action, 'getTicket')
    assert.equal(token, ticket.token)
    res.json({ ok: true, data: ticket })
  })
  const registrationApiUrl = await listen(createServer(lookupApp))
  const emailApp = createEmailApp({
    transporter: { sendMail },
    fromAddress: 'Kindness Jam <tickets@example.org>',
    registrationApiUrl,
    allowedOrigins: ['http://localhost:5173'],
  })
  const emailApiUrl = await listen(createServer(emailApp))
  return {
    get lookups() { return lookups },
    async post(body, origin = 'http://localhost:5173') {
      const response = await fetch(`${emailApiUrl}/api/send-confirmation-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: origin },
        body: JSON.stringify(body),
      })
      return { status: response.status, body: await response.json() }
    },
  }
}

function makeTicket() {
  return {
    token: randomUUID(),
    regNo: `KJ-${randomUUID()}`,
    name: 'Jamie Example',
    email: 'jamie@example.org',
    orgName: 'Example Organisation',
  }
}

function emailRequest(ticket, overrides = {}) {
  return {
    email: ticket.email,
    name: ticket.name,
    regNo: ticket.regNo,
    token: ticket.token,
    ...overrides,
  }
}

test('validates email addresses syntactically', () => {
  assert.equal(isValidEmail(' attendee@example.org '), true)
  assert.equal(isValidEmail('not-an-email'), false)
  assert.equal(isValidEmail('attacker@example.org\r\nBcc:someone@example.org'), false)
})

test('sends a QR attachment for the saved registration and suppresses duplicate submissions', async () => {
  const ticket = makeTicket()
  const messages = []
  const harness = await createHarness(ticket, async (message) => { messages.push(message) })
  const first = await harness.post(emailRequest(ticket))
  assert.equal(first.status, 200)
  assert.equal(first.body.emailStatus, 'sent')
  assert.equal(messages.length, 1)
  assert.equal(messages[0].to, ticket.email)
  assert.match(messages[0].html, /Example Organisation/)
  assert.match(messages[0].html, /Jamie Example/)
  assert.equal(messages[0].attachments[0].contentType, 'image/png')
  assert.deepEqual(
    messages[0].attachments[0].content,
    await QRCode.toBuffer(ticket.token, {
      errorCorrectionLevel: 'H',
      width: 400,
      margin: 2,
      color: { dark: '#2E1065', light: '#FFFFFF' },
    }),
  )

  const duplicate = await harness.post(emailRequest(ticket))
  assert.equal(duplicate.status, 200)
  assert.equal(duplicate.body.alreadySent, true)
  assert.equal(messages.length, 1)
})

test('rejects an invalid email before looking up a registration', async () => {
  const ticket = makeTicket()
  const harness = await createHarness(ticket, async () => assert.fail('must not send'))
  const result = await harness.post(emailRequest(ticket, { email: 'invalid' }))
  assert.equal(result.status, 400)
  assert.equal(harness.lookups, 0)
})

test('only sends to the email saved on the registration', async () => {
  const ticket = makeTicket()
  const harness = await createHarness(ticket, async () => assert.fail('must not send'))
  const result = await harness.post(emailRequest(ticket, { email: 'other@example.org' }))
  assert.equal(result.status, 403)
})

test('keeps failures retryable and blocks duplicate origins', async () => {
  const ticket = makeTicket()
  let attempts = 0
  const harness = await createHarness(ticket, async () => {
    attempts += 1
    if (attempts === 1) throw Object.assign(new Error('private provider detail'), { code: 'EAUTH' })
  })

  const failed = await harness.post(emailRequest(ticket))
  assert.equal(failed.status, 503)
  assert.equal(failed.body.emailStatus, 'failed')
  assert.doesNotMatch(JSON.stringify(failed.body), /private provider detail|EAUTH/)

  const blockedOrigin = await harness.post(emailRequest(ticket), 'https://untrusted.example')
  assert.equal(blockedOrigin.status, 403)
  assert.equal(attempts, 1)

  const retried = await harness.post(emailRequest(ticket))
  assert.equal(retried.status, 200)
  assert.equal(retried.body.emailStatus, 'sent')
  assert.equal(attempts, 2)
})

test('coalesces concurrent requests for the same ticket', async () => {
  const ticket = makeTicket()
  let attempts = 0
  const harness = await createHarness(ticket, async () => {
    attempts += 1
    await new Promise((resolve) => setTimeout(resolve, 25))
  })
  const results = await Promise.all([
    harness.post(emailRequest(ticket)),
    harness.post(emailRequest(ticket)),
  ])
  assert.deepEqual(results.map((result) => result.status), [200, 200])
  assert.equal(attempts, 1)
  assert.equal(results.filter((result) => result.body.alreadySent).length, 1)
})
