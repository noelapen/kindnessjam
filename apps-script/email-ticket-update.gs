/*
 * Replace the existing sendTicketEmail(t) in the Apps Script project with
 * this function and add the helper functions below it. This uses existing
 * globals/helpers from the registration script: getSettings(), esc(), TZ,
 * and REGS().
 */
function sendTicketEmail(t) {
  let pdfFile = null;
  try {
    const s = getSettings();
    const base = String(s.SiteURL || '').replace(/\/+$/, '');
    const ticketUrl = base ? base + '/ticket/' + encodeURIComponent(t.token) : '';
    const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=12&ecc=H&data='
      + encodeURIComponent(t.token);
    const qr = UrlFetchApp.fetch(qrUrl, { muteHttpExceptions: true });
    if (qr.getResponseCode() < 200 || qr.getResponseCode() >= 300) {
      throw new Error('QR image provider returned HTTP ' + qr.getResponseCode());
    }
    const qrBlob = qr.getBlob().setName('KindnessJam-' + t.regNo + '-QR.png');
    const pdf = createTicketPdf_(t, s, qrBlob);
    pdfFile = pdf.file;

    const subject = 'Your Kindness Jam ticket (' + t.regNo + ') | Kindness Unlimited';
    const body = buildTicketEmailText_(t);
    const htmlBody = buildTicketEmailHtml_(t);
    const options = {
      to: t.email,
      subject: subject,
      body: body,
      htmlBody: htmlBody,
      name: s.SenderName || 'Team Kindness Unlimited',
      attachments: [pdf.blob]
    };
    if (s.ReplyTo) options.replyTo = s.ReplyTo;
    MailApp.sendEmail(options);

    try {
      REGS().getRange(t.row, 12).setValue(
        'Sent ' + Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm')
      );
    } catch (statusError) {
      console.error('Email sent but EmailStatus could not be updated for ' + t.regNo);
    }
    return true;
  } catch (err) {
    console.error('Ticket email failed for ' + t.regNo + ': ' + String(err).slice(0, 200));
    try {
      REGS().getRange(t.row, 12).setValue('Failed: ' + String(err).slice(0, 120));
    } catch (statusError) {
      console.error('Could not update EmailStatus for ' + t.regNo);
    }
    return false;
  } finally {
    if (pdfFile) {
      try {
        DriveApp.getFileById(pdfFile.getId()).setTrashed(true);
      } catch (cleanupError) {
        console.error('Could not remove temporary ticket PDF for ' + t.regNo);
      }
    }
  }
}

function createTicketPdf_(t, settings, qrBlob) {
  const doc = DocumentApp.create('Temporary Kindness Jam ticket ' + t.regNo);
  const file = DriveApp.getFileById(doc.getId());
  try {
    const body = doc.getBody();
    body.clear();
    body.setMarginTop(22);
    body.setMarginBottom(22);
    body.setMarginLeft(26);
    body.setMarginRight(26);
    const logo = fetchTicketImage_(settings.TicketLogoURL, 'kindness-jam-logo');
    const iraPhoto = fetchTicketImage_(settings.IraImageURL, 'ira-khan');
    const anshuPhoto = fetchTicketImage_(settings.AnshuImageURL, 'anshu-gupta');
    const anishRiyaPhoto = fetchTicketImage_(settings.AnishRiyaImageURL, 'anish-riya');

    const header = body.appendTable([['', '']]);
    header.setBorderWidth(0);
    setTicketCell_(header.getCell(0, 0), '#0F33C4', 18);
    setTicketCell_(header.getCell(0, 1), '#D4F634', 12);
    addTicketText_(header.getCell(0, 0), 'KINDNESS UNLIMITED\nPRESENTS', 10, '#FFFFFF', true, DocumentApp.HorizontalAlignment.LEFT);
    addTicketText_(header.getCell(0, 0), 'The Kindness Jam 2026', 25, '#FFFFFF', true, DocumentApp.HorizontalAlignment.LEFT);
    addTicketText_(header.getCell(0, 0), 'PASS FOR: ' + t.name, 11, '#FFFFFF', true, DocumentApp.HorizontalAlignment.LEFT);
    if (logo) appendTicketImage_(header.getCell(0, 1), logo, 48);
    addTicketText_(header.getCell(0, 1), 'NOV\n28\nSAT, 3:30 PM', 16, '#000000', true, DocumentApp.HorizontalAlignment.CENTER);
    header.setColumnWidth(0, 365);
    header.setColumnWidth(1, 150);

    const guests = body.appendTable([['', '', '']]);
    guests.setBorderWidth(0);
    for (let col = 0; col < 3; col++) {
      const cell = guests.getCell(0, col);
      setTicketCell_(cell, '#0F33C4', 8);
      const photo = [iraPhoto, anshuPhoto, anishRiyaPhoto][col];
      if (photo) appendTicketImage_(cell, photo, 60);
      addTicketText_(cell, [
        'Ira Khan\nFounder & CEO\nAgatsu Foundation',
        'Anshu Gupta\nFounder of Goonj',
        'Anish and Riya\nAcapella · Better Halves'
      ][col], 10, '#FFFFFF', true, DocumentApp.HorizontalAlignment.CENTER);
    }

    const artistsBanner = body.appendTable([['']]);
    artistsBanner.setBorderWidth(0);
    setTicketCell_(artistsBanner.getCell(0, 0), '#D4F634', 8);
    addTicketText_(artistsBanner.getCell(0, 0), '...and many more artists', 13, '#000000', true, DocumentApp.HorizontalAlignment.CENTER);

    const details = body.appendTable([['', '']]);
    details.setBorderWidth(0);
    setTicketCell_(details.getCell(0, 0), '#0F33C4', 14);
    setTicketCell_(details.getCell(0, 1), '#FA7B62', 10);
    addTicketText_(details.getCell(0, 0), 'AN EVENING OF MUSIC, FUN\n& CELEBRATION', 13, '#FFFFFF', true, DocumentApp.HorizontalAlignment.LEFT);
    addTicketText_(details.getCell(0, 0), "Venue: D’monte Park Recreation Club Ground, St. Andrew’s Road, Bandra West, Mumbai", 11, '#FFFFFF', false, DocumentApp.HorizontalAlignment.LEFT);
    addTicketText_(details.getCell(0, 0), 'Communication partner: #Schbang.', 9, '#FFFFFF', true, DocumentApp.HorizontalAlignment.LEFT);
    addTicketText_(details.getCell(0, 1), 'PASS ID: ' + t.regNo, 11, '#FFFFFF', true, DocumentApp.HorizontalAlignment.CENTER);
    const qrParagraph = details.getCell(0, 1).appendParagraph('');
    qrParagraph.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    qrParagraph.appendInlineImage(qrBlob).setWidth(142).setHeight(142);
    addTicketText_(details.getCell(0, 1), 'SCAN TO ENTER', 10, '#FFFFFF', true, DocumentApp.HorizontalAlignment.CENTER);
    details.setColumnWidth(0, 300);
    details.setColumnWidth(1, 190);

    const footer = body.appendTable([['']]);
    footer.setBorderWidth(0);
    setTicketCell_(footer.getCell(0, 0), '#D4F634', 12);
    addTicketText_(footer.getCell(0, 0), 'THE FUN STARTS AT 3:30 PM!!!\nLET US ALL CELEBRATE UNDER THE OPEN SKY\n\nAND DO NOT FORGET YOUR:  HAT ✓   MAT ✓   WATER ✓   KIND HEART ✓✓\n\nSEE YOU THERE!!', 10, '#000000', true, DocumentApp.HorizontalAlignment.CENTER);

    appendTicketParagraph_(body, 'Google Maps: https://maps.app.goo.gl/LQjSThtRdpREZHReA', 8, false, '#6425B8', true);
    appendTicketParagraph_(body, 'Ticket holder: ' + t.name + '  |  Registration: ' + t.regNo, 8, true, '#32116F', true);
    if (settings.SiteURL) {
      appendTicketParagraph_(body, 'View your online ticket: ' + String(settings.SiteURL).replace(/\/+$/, '') + '/ticket/' + encodeURIComponent(t.token), 8, false, '#6425B8', true);
    }

    doc.saveAndClose();
    const blob = file.getAs(MimeType.PDF).setName('KindnessJam-Ticket-' + t.regNo + '.pdf');
    return { file: file, blob: blob };
  } catch (err) {
    try {
      doc.saveAndClose();
    } catch (closeError) {
      console.error('Could not close temporary ticket document for ' + t.regNo);
    }
    file.setTrashed(true);
    throw err;
  }
}

function appendTicketParagraph_(body, text, fontSize, bold, color, centered) {
  const paragraph = body.appendParagraph(String(text));
  paragraph.setSpacingBefore(2);
  paragraph.setSpacingAfter(5);
  if (centered) paragraph.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  const style = paragraph.editAsText();
  style.setFontFamily('Arial');
  style.setFontSize(fontSize);
  style.setForegroundColor(color);
  style.setBold(bold);
  return paragraph;
}

function setTicketCell_(cell, background, padding) {
  cell.setBackgroundColor(background);
  cell.setPaddingTop(padding);
  cell.setPaddingBottom(padding);
  cell.setPaddingLeft(padding);
  cell.setPaddingRight(padding);
  cell.setVerticalAlignment(DocumentApp.VerticalAlignment.CENTER);
}

function addTicketText_(cell, text, fontSize, color, bold, alignment) {
  const paragraph = cell.appendParagraph(String(text));
  paragraph.setSpacingBefore(0);
  paragraph.setSpacingAfter(3);
  paragraph.setAlignment(alignment);
  const style = paragraph.editAsText();
  style.setFontFamily('Arial');
  style.setFontSize(fontSize);
  style.setForegroundColor(color);
  style.setBold(bold);
  return paragraph;
}

function appendTicketImage_(cell, blob, size) {
  const paragraph = cell.appendParagraph('');
  paragraph.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  paragraph.setSpacingBefore(0);
  paragraph.setSpacingAfter(3);
  paragraph.appendInlineImage(blob).setWidth(size).setHeight(size);
}

function fetchTicketImage_(url, label) {
  if (!url) return null;
  try {
    const response = UrlFetchApp.fetch(String(url), { muteHttpExceptions: true });
    if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
      console.error('Ticket artwork unavailable: ' + label);
      return null;
    }
    const blob = response.getBlob();
    if (!String(blob.getContentType()).toLowerCase().startsWith('image/')) {
      console.error('Ticket artwork is not an image: ' + label);
      return null;
    }
    return blob.setName(label);
  } catch (err) {
    console.error('Ticket artwork unavailable: ' + label);
    return null;
  }
}

function buildTicketEmailText_(t) {
  const name = String(t.name || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 120);
  const regNo = String(t.regNo || '').replace(/[\r\n]+/g, '').trim().slice(0, 80);
  return `Dear ${name},

🌟 You're officially part of something beautiful!

Thank you for registering for Kindness Jam, organised by Kindness Unlimited! Get ready for an afternoon filled with positive energy, meaningful connections, and a celebration of the power of kindness.

Because kindness isn't just something we believe in — it's something we live, share, and spread. And we're excited to have YOU be part of it!

🎶 YOUR KINDNESS JAM EXPERIENCE

📅 Date: Saturday, 28 November 2026
🕞 Time: 3:30 PM
📍 Venue: D.P.R.C. (D'Monte Park Recreation Center), St Andrews Road, Bandra West, Mumbai
🗺️ Google Maps: https://maps.app.goo.gl/LQjSThtRdpREZHReA

🎟️ YOUR ENTRY PASS

Registration Number: ${regNo}
Name: ${name}

Your personalised entry ticket, featuring your unique QR code, is attached to this email as an image.

Simply show your QR code at the entrance for verification and get ready to join the celebration!

Please keep your ticket safe and do not share your QR code with anyone else.

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
}

function buildTicketEmailHtml_(t) {
  return '<div style="font-family:Arial,Helvetica,sans-serif;white-space:pre-wrap;line-height:1.55">'
    + esc(buildTicketEmailText_(t)).replace(/\n/g, '<br>')
    + '</div>';
}

function authorizeTicketEmailServices() {
  const testToken = Utilities.getUuid();
  const qrResponse = UrlFetchApp.fetch(
    'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=' + encodeURIComponent(testToken),
    { muteHttpExceptions: true }
  );
  if (qrResponse.getResponseCode() < 200 || qrResponse.getResponseCode() >= 300) {
    throw new Error('Could not authorize the QR image request.');
  }

  const doc = DocumentApp.create('Temporary Kindness Jam authorization check');
  try {
    doc.getBody().appendParagraph('Authorization check');
    doc.saveAndClose();
  } finally {
    DriveApp.getFileById(doc.getId()).setTrashed(true);
  }

  const sender = Session.getActiveUser().getEmail();
  if (!sender) throw new Error('Could not determine the active account email.');
  MailApp.sendEmail(sender, 'Kindness Jam email authorization check', 'Ticket email services are authorized.');
}
