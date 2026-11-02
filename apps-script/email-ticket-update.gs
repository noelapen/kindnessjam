/**
 * KINDNESS JAM - Registration Backend (Google Apps Script)
 * Kindness Unlimited | v4: email tickets, no Type/Passcode
 * Organizations columns: A OrgCode | B OrgName | C Quota | D Deadline | E Active
 * Registrations columns: A RegNo | B Token | C OrgCode | D OrgName | E Name | F Phone |
 *   G Timestamp | H Status | I CheckedIn | J CheckedInAt | K Email | L EmailStatus
 */

const ss = SpreadsheetApp.getActiveSpreadsheet();
const TZ = Session.getScriptTimeZone();
const ORGS = () => ss.getSheetByName('Organizations');
const REGS = () => ss.getSheetByName('Registrations');
const SETTINGS = () => ss.getSheetByName('Settings');
const ADMIN_KEY = () => PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');

/* ============ HTTP ENTRY POINTS ============ */
function out(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function ok(data){ return out({ok:true, data}); }
function fail(error){ return out({ok:false, error}); }

function doGet(){ return ok('Kindness Jam API running - v4 email'); }

function doPost(e){
  try {
    const p = JSON.parse(e.postData.contents);
    switch(p.action){
      case 'getOrgs':               return ok(allOrgs().filter(o=>o.active));
      case 'getOrg':                return ok(findOrg(p.orgCode));
      case 'register':              return register(p);
      case 'getTicket':             return getTicket(p.token);
      case 'findByPhone':           return findByPhone(p.phone);
      case 'adminLogin':            return isAdmin(p) ? ok(true) : fail('Wrong admin key');
      case 'adminSummary':          return isAdmin(p) ? ok(summary()) : fail('Unauthorized');
      case 'adminOrgRegistrations': return isAdmin(p) ? ok(orgRegs(p.orgCode)) : fail('Unauthorized');
      case 'updateOrg':             return isAdmin(p) ? updateOrg(p) : fail('Unauthorized');
      case 'addOrg':                return isAdmin(p) ? addOrg(p) : fail('Unauthorized');
      case 'verify':                return isAdmin(p) ? verify(p.token) : fail('Unauthorized');
      case 'lookupRegNo':           return isAdmin(p) ? lookupRegNo(p.regNo) : fail('Unauthorized');
      case 'resendTicketEmail':     return isAdmin(p) ? resendTicketEmail(p.regNo) : fail('Unauthorized');
      default:                      return fail('Unknown action');
    }
  } catch(err){ return fail(String(err)); }
}

/* ============ HELPERS ============ */
function isAdmin(p){ return !!p.adminKey && p.adminKey === ADMIN_KEY(); }

function rows(sheet){
  const v = sheet.getDataRange().getValues();
  if (v.length < 2) return [];
  const h = v.shift();
  return v.map((r,i)=>{ const o={_row:i+2}; h.forEach((k,j)=>o[k]=r[j]); return o; });
}

function fmtDate(d){
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(dt) ? String(d) : Utilities.formatDate(dt, TZ, "yyyy-MM-dd");
}

function fmtDateTime(d){
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(dt) ? String(d) : Utilities.formatDate(dt, TZ, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

function esc(x){ return String(x||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function countConfirmed(orgCode){
  return rows(REGS()).filter(r=>r.OrgCode===orgCode && r.Status==='Confirmed').length;
}

function orgObj(o, regs){
  const used = regs
    ? regs.filter(r=>r.OrgCode===o.OrgCode && r.Status==='Confirmed').length
    : countConfirmed(o.OrgCode);
  const quota = Number(o.Quota)||0;
  let deadline = null;
  if (o.Deadline) { deadline = new Date(o.Deadline); if(!isNaN(deadline)) deadline.setHours(23,59,59,999); else deadline = null; }
  const active = String(o.Active).toUpperCase()==='TRUE';
  const open = active && used<quota && (!deadline || new Date()<=deadline);
  return {orgCode:o.OrgCode, orgName:o.OrgName, quota, used,
          remaining:Math.max(quota-used,0), deadline:fmtDate(o.Deadline), active, open};
}

function allOrgs(){
  const regs = rows(REGS());
  return rows(ORGS()).filter(o=>o.OrgCode).map(o=>orgObj(o, regs));
}

function findOrg(code){
  const o = allOrgs().find(x=>x.orgCode===code);
  if(!o) throw 'Organisation not found';
  return o;
}

/* ============ SETTINGS (Settings tab) ============ */
function getSettings(){
  const s = { 
    SiteURL: '', 
    EventName: 'Kindness Jam', 
    EventDate: 'Saturday, 28 November 2026', 
    EventTime: '3:30 PM',
    Venue: "St. Andrew's School Ground,St. Andrew's Road, Bandra West", 
    MapsLink: 'https://www.google.com/maps?q=19.057231903076172,72.8266372680664&z=17&hl=en', 
    SenderName: 'Kindness Unlimited', 
    ReplyTo: '' 
  };
  const sh = SETTINGS();
  if (sh) sh.getDataRange().getValues().forEach(r=>{
    if (r[0] && r[1] !== '') s[String(r[0]).trim()] = (r[1] instanceof Date) ? fmtDate(r[1]) : String(r[1]).trim();
  });
  return s;
}

/* ============ REGISTRATION ============ */
function register(p){
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  let created;
  try {
    const org = findOrg(p.orgCode);
    if(!org.active) return fail('Registration is closed for this organisation.');
    if(org.deadline){
      const dl = new Date(org.deadline); dl.setHours(23,59,59,999);
      if(new Date()>dl) return fail('Registration deadline has passed.');
    }
    if(org.used>=org.quota) return fail('All tickets for '+org.orgName+' are taken.');

    const name = String(p.name||'').trim();
    if(!name) return fail('Name is required.');
    const phone = String(p.phone||'').replace(/\D/g,'').slice(-10);
    if(!/^\d{10}$/.test(phone)) return fail('Enter a valid 10-digit phone number.');
    const email = String(p.email||'').trim().toLowerCase();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail('Enter a valid email address.');

    const all = rows(REGS());
    const dup = all.find(r=>String(r.Phone).replace(/\D/g,'').slice(-10)===phone && r.Status==='Confirmed');
    if(dup) return fail('This phone number is already registered.');

    let max = 0;
    all.forEach(r=>{ const n = parseInt(String(r.RegNo).replace(/\D/g,''),10); if(n>max) max=n; });
    const regNo = 'KJ-' + String(max+1).padStart(4,'0');
    const token = Utilities.getUuid();

    REGS().appendRow([regNo, token, org.orgCode, org.orgName, name, phone, new Date(), 'Confirmed', '', '', email, 'Pending']);
    created = { regNo, token, name, orgName: org.orgName, email, row: REGS().getLastRow() };
  } finally { lock.releaseLock(); }

  // Sent after the lock is released. If email fails, registration still succeeds.
  const emailSent = sendTicketEmail(created);
  return ok({ regNo: created.regNo, token: created.token, emailSent });
}

function getTicket(token){
  const r = rows(REGS()).find(x=>x.Token===token && x.Status==='Confirmed');
  if(!r) return fail('Ticket not found');
  return ok({regNo:r.RegNo, name:r.Name, orgName:r.OrgName,
             checkedIn:r.CheckedIn==='YES', checkedInAt:fmtDateTime(r.CheckedInAt)});
}

function findByPhone(phone){
  const ph = String(phone||'').replace(/\D/g,'').slice(-10);
  const r = rows(REGS()).find(x=>String(x.Phone).replace(/\D/g,'').slice(-10)===ph && x.Status==='Confirmed');
  return r ? ok({token:r.Token}) : fail('No ticket found for this number');
}

/* ============ TICKET EMAIL ============ */
function sendTicketEmail(t){
  try {
    const s = getSettings();
    const base = String(s.SiteURL || '').replace(/\/+$/, '');
    const ticketUrl = base ? base + '/ticket/' + encodeURIComponent(t.token) : '';

    const eventDate = s.EventDate || 'Saturday, 28 November 2026';
    const eventTime = s.EventTime || '3:30 PM';
    const venue = s.Venue || "St. Andrew's School Ground,St. Andrew's Road, Bandra West";
    const mapsLink = s.MapsLink || 'https://www.google.com/maps?q=19.057231903076172,72.8266372680664&z=17&hl=en';
    const eventName = s.EventName || 'Kindness Jam';
    const senderName = s.SenderName || 'Kindness Unlimited';

    // Fetch dynamic QR code
    let qr = null;
    try {
      const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=12&ecc=H&data=' + encodeURIComponent(t.token);
      qr = UrlFetchApp.fetch(qrUrl).getBlob().setName('KindnessJam-' + t.regNo + '-QR.png');
    } catch(e1){ 
      qr = null; 
    }

    const subject = `Your ${eventName} ticket (${t.regNo}) | ${senderName}`;

    const plain = 
`Dear ${t.name},

🌟 You're officially part of something beautiful!

Thank you for registering for ${eventName}, organised by ${senderName}! Get ready for an afternoon filled with positive energy, meaningful connections, and a celebration of the power of kindness.

Because kindness isn't just something we believe in it's something we live, share, and spread. And we're excited to have YOU be part of it!

🎶 YOUR KINDNESS JAM EXPERIENCE

📅 Date: ${eventDate}
🕞 Time: ${eventTime}
📍 Venue: ${venue}
🗺️ Google Maps: ${mapsLink}

🎟️ YOUR ENTRY PASS

Registration Number: ${t.regNo}
Name: ${t.name}

${qr ? 'Your personalised entry ticket, featuring your unique QR code, is attached to this email as an image.\n\n' : ''}Simply show your QR code at the entrance for verification and get ready to join the celebration!

Please keep your ticket safe and do not share your QR code with anyone else.
${ticketUrl ? '\nView / download your ticket: ' + ticketUrl + '\n' : ''}
🌿 A LITTLE PREPARATION FOR A LOT OF GOOD VIBES!

We're gathering outdoors, so do bring along:

🧢 A hat or cap to stay comfortable
💧 A water bottle to keep yourself hydrated
🧺 A towel, picnic mat, or newspaper to sit on the grass

💚 COME AS YOU ARE. LEAVE WITH A LITTLE MORE KINDNESS.

Every act of kindness has the power to make a difference. Every person who joins us helps that spirit travel a little further.

Let's come together, connect with one another, and celebrate a simple yet powerful idea: a kinder world begins with us.

We can't wait to welcome you to Kindness Jam 2026!

With warmth and kindness,
Team Kindness Unlimited
Kindness Is Action. Let's Make It Happen!`;

    const html = `
<div style="background-color:#F5F3EF;padding:30px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2D3748;line-height:1.6;">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);border:1px solid #E2E8F0;">
    
    <!-- Top Header -->
    <tr>
      <td style="background:#5B21B6;background:linear-gradient(135deg,#7C3AED,#4C1D95);padding:32px 24px;text-align:center;color:#ffffff;">
        <div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;opacity:0.9;font-weight:600;">Kindness Unlimited</div>
        <div style="font-size:26px;font-weight:700;margin-top:6px;">${esc(eventName)}</div>
        <div style="font-size:14px;margin-top:4px;opacity:0.9;">🌟 You're officially part of something beautiful!</div>
      </td>
    </tr>

    <!-- Content -->
    <tr>
      <td style="padding:28px 24px;">
        <p style="font-size:16px;margin:0 0 16px;">Dear <b>${esc(t.name)}</b>,</p>
        
        <p style="margin:0 0 14px;font-size:15px;color:#4A5568;">
          Thank you for registering for <b>${esc(eventName)}</b>, organised by <b>${esc(senderName)}</b>! Get ready for an afternoon filled with positive energy, meaningful connections, and a celebration of the power of kindness.
        </p>

        <p style="margin:0 0 24px;font-size:15px;color:#4A5568;">
          Because kindness isn't just something we believe in — it's something we live, share, and spread. And we're excited to have <b>YOU</b> be part of it!
        </p>

        <!-- Experience Box -->
        <div style="background:#FAF5FF;border:1px solid #E9D5FF;border-radius:12px;padding:18px 20px;margin-bottom:24px;">
          <div style="font-size:15px;font-weight:700;color:#6B21A8;margin-bottom:12px;">🎶 YOUR KINDNESS JAM EXPERIENCE</div>
          <table role="presentation" width="100%" style="font-size:14px;line-height:1.7;color:#374151;">
            <tr><td style="width:28px;vertical-align:top;">📅</td><td><b>Date:</b> ${esc(eventDate)}</td></tr>
            <tr><td style="vertical-align:top;">🕞</td><td><b>Time:</b> ${esc(eventTime)}</td></tr>
            <tr><td style="vertical-align:top;">📍</td><td><b>Venue:</b> ${esc(venue)}</td></tr>
            <tr><td style="vertical-align:top;">🗺️</td><td><b>Google Maps:</b> <a href="${esc(mapsLink)}" style="color:#7C3AED;text-decoration:none;font-weight:600;">View Location Link</a></td></tr>
          </table>
        </div>

        <!-- Entry Pass Box -->
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
          <div style="font-size:15px;font-weight:700;color:#1E293B;margin-bottom:12px;">🎟️ YOUR ENTRY PASS</div>
          <table role="presentation" style="margin:0 auto 16px;font-size:14px;text-align:left;">
            <tr><td style="padding:4px 8px;color:#64748B;">Registration Number:</td><td style="padding:4px 8px;font-weight:700;color:#1E293B;">${esc(t.regNo)}</td></tr>
            <tr><td style="padding:4px 8px;color:#64748B;">Name:</td><td style="padding:4px 8px;font-weight:700;color:#1E293B;">${esc(t.name)}</td></tr>
          </table>

          ${qr ? `
            <div style="margin:16px 0;">
              <img src="cid:qrcode" alt="Entry QR Code" width="200" height="200" style="border:4px solid #EDE9FE;border-radius:12px;display:inline-block;">
              <p style="font-size:12px;color:#64748B;margin:8px 0 0;">(A PNG copy is also attached to this email)</p>
            </div>
          ` : ''}

          <p style="font-size:14px;color:#334155;margin:12px 0 6px;">
            Simply show your QR code at the entrance for verification and get ready to join the celebration!
          </p>
          <p style="font-size:12px;color:#DC2626;margin:0;font-weight:500;">
            Please keep your ticket safe and do not share your QR code with anyone else.
          </p>

          ${ticketUrl ? `
            <div style="margin-top:16px;">
              <a href="${ticketUrl}" style="background:#7C3AED;color:#ffffff;text-decoration:none;padding:10px 22px;border-radius:999px;font-weight:600;font-size:13px;display:inline-block;">View / Download Digital Ticket</a>
            </div>
          ` : ''}
        </div>

        <!-- Preparation Checklist -->
        <div style="background:#FEFCE8;border:1px solid #FEF08A;border-radius:12px;padding:16px 20px;margin-bottom:24px;font-size:14px;color:#713F12;">
          <div style="font-weight:700;margin-bottom:8px;">🌿 A LITTLE PREPARATION FOR A LOT OF GOOD VIBES!</div>
          <p style="margin:0 0 10px;">We're gathering outdoors, so do bring along:</p>
          <div style="margin-bottom:4px;">🧢 <b>A hat or cap</b> to stay comfortable</div>
          <div style="margin-bottom:4px;">💧 <b>A water bottle</b> to keep yourself hydrated</div>
          <div>🧺 <b>A towel, picnic mat, or newspaper</b> to sit on the grass</div>
        </div>

        <!-- Closing Note -->
        <div style="border-top:1px solid #E2E8F0;padding-top:20px;font-size:14px;color:#4A5568;">
          <p style="font-weight:700;color:#15803D;margin:0 0 8px;">💚 COME AS YOU ARE. LEAVE WITH A LITTLE MORE KINDNESS.</p>
          <p style="margin:0 0 10px;">Every act of kindness has the power to make a difference. Every person who joins us helps that spirit travel a little further.</p>
          <p style="margin:0 0 16px;">Let's come together, connect with one another, and celebrate a simple yet powerful idea: <i>a kinder world begins with us.</i></p>
          <p style="font-weight:600;color:#1E293B;margin:0 0 18px;">We can't wait to welcome you to Kindness Jam 2026!</p>
          
          <p style="margin:0;color:#64748B;">
            With warmth and kindness,<br>
            <b style="color:#1E293B;">Team Kindness Unlimited</b><br>
            <i>Kindness Is Action. Let's Make It Happen!</i>
          </p>
        </div>

      </td>
    </tr>
  </table>
</div>`;

    const opts = { 
      to: t.email, 
      subject, 
      body: plain, 
      htmlBody: html, 
      name: senderName 
    };
    
    if (qr) { 
      opts.inlineImages = { qrcode: qr }; 
      opts.attachments = [qr]; 
    }
    if (s.ReplyTo) opts.replyTo = s.ReplyTo;
    
    MailApp.sendEmail(opts);

    REGS().getRange(t.row, 12).setValue('Sent ' + Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm'));
    return true;
  } catch (err) {
    try { 
      REGS().getRange(t.row, 12).setValue('Failed: ' + String(err).slice(0,120)); 
    } catch(e2){}
    return false;
  }
}

function resendTicketEmail(regNo){
  const r = rows(REGS()).find(x=>String(x.RegNo).toUpperCase()===String(regNo).trim().toUpperCase() && x.Status==='Confirmed');
  if(!r) return fail('Registration number not found');
  if(!r.Email) return fail('No email stored for this registration');
  const sent = sendTicketEmail({ regNo:r.RegNo, token:r.Token, name:r.Name, orgName:r.OrgName, email:r.Email, row:r._row });
  return sent ? ok({sent:true}) : fail('Email could not be sent. See EmailStatus column.');
}

// RUN ONCE from the editor: grants mail permission and sends a sample to yourself
function testEmail(){
  const me = Session.getActiveUser().getEmail();
  const sent = sendTicketEmail({ regNo:'KJ-TEST', token:Utilities.getUuid(), name:'Test User', orgName:'Demo NGO', email:me, row:1 });
  Logger.log(sent ? 'Sample email sent to ' + me : 'Failed');
}

/* ============ ADMIN ============ */
function summary(){
  const regs = rows(REGS()).filter(r=>r.Status==='Confirmed');
  const orgs = rows(ORGS()).filter(o=>o.OrgCode).map(o=>{
    const base = orgObj(o, regs);
    base.checkedIn = regs.filter(r=>r.OrgCode===o.OrgCode && r.CheckedIn==='YES').length;
    return base;
  });
  const sum = k => orgs.reduce((a,o)=>a+o[k],0);
  return {orgs, totals:{
    orgs:orgs.length, quota:sum('quota'), registered:sum('used'),
    checkedIn:sum('checkedIn'), remaining:sum('remaining')}};
}

function orgRegs(code){
  return rows(REGS()).filter(r=>r.OrgCode===code && r.Status==='Confirmed')
    .map(r=>({regNo:r.RegNo, name:r.Name, phone:String(r.Phone), email:r.Email||'',
              emailStatus:r.EmailStatus||'', registeredAt:fmtDateTime(r.Timestamp),
              checkedIn:r.CheckedIn==='YES', checkedInAt:fmtDateTime(r.CheckedInAt)}));
}

function updateOrg(p){
  const o = rows(ORGS()).find(x=>x.OrgCode===p.orgCode);
  if(!o) return fail('Organisation not found');
  const used = countConfirmed(p.orgCode);
  if(p.quota!==undefined && p.quota!==null && p.quota!==''){
    if(Number(p.quota)<used) return fail('Quota cannot be below current registrations ('+used+').');
    ORGS().getRange(o._row,3).setValue(Number(p.quota));      // C = Quota
  }
  if(p.deadline!==undefined) ORGS().getRange(o._row,4).setValue(p.deadline); // D = Deadline
  if(p.active!==undefined)   ORGS().getRange(o._row,5).setValue(!!p.active); // E = Active
  return ok(true);
}

function addOrg(p){
  if(!p.orgName || !String(p.orgName).trim()) return fail('Organisation name is required.');
  if(!(Number(p.quota)>0)) return fail('Quota must be greater than 0.');
  const code = String(p.orgName).replace(/[^a-zA-Z0-9]/g,'').slice(0,6).toUpperCase() + Math.floor(100+Math.random()*900);
  ORGS().appendRow([code, String(p.orgName).trim(), Number(p.quota), p.deadline||'', true]);
  return ok({orgCode:code});
}

/* ============ ENTRY VERIFICATION ============ */
function verify(token){
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const r = rows(REGS()).find(x=>x.Token===String(token).trim() && x.Status==='Confirmed');
    if(!r) return ok({status:'INVALID'});
    if(r.CheckedIn==='YES')
      return ok({status:'USED', name:r.Name, orgName:r.OrgName, regNo:r.RegNo, checkedInAt:fmtDateTime(r.CheckedInAt)});
    const now = new Date();
    REGS().getRange(r._row,9,1,2).setValues([['YES',now]]);   // I = CheckedIn, J = CheckedInAt
    return ok({status:'ALLOWED', name:r.Name, orgName:r.OrgName, regNo:r.RegNo, checkedInAt:fmtDateTime(now)});
  } finally { lock.releaseLock(); }
}

function lookupRegNo(regNo){
  const r = rows(REGS()).find(x=>String(x.RegNo).toUpperCase()===String(regNo).trim().toUpperCase() && x.Status==='Confirmed');
  return r ? ok({token:r.Token}) : fail('Registration number not found');
}