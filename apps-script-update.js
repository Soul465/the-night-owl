// ============================================================
// The Midnight Drop — Apps Script (FULL REPLACEMENT)
// Paste this ENTIRE script into Extensions → Apps Script
// replacing everything that's there, then redeploy.
// ============================================================

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var type = data.type || 'subscribe';

    // --- Newsletter signup ---
    if (type === 'subscribe' || type === 'newsletter') {
      return handleSubscribe(data);
    }

    // --- Song Spotlight submission ---
    if (type === 'spotlight') {
      return handleSpotlight(data);
    }

    // --- Send newsletter to all subscribers ---
    if (type === 'send_newsletter') {
      return handleSendNewsletter(data);
    }

    return jsonResponse({ result: 'error', message: 'Unknown type: ' + type });
  } catch (error) {
    return jsonResponse({ result: 'error', message: error.toString() });
  }
}

// ---- Subscribe handler ----
function handleSubscribe(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var email = data.email;

  var emails = sheet.getRange("A:A").getValues().flat();
  if (emails.includes(email)) {
    return jsonResponse({ result: 'duplicate', message: 'Already subscribed' });
  }

  sheet.appendRow([email, new Date().toISOString()]);
  return jsonResponse({ result: 'success', message: 'Subscribed' });
}

// ---- Spotlight handler ----
function handleSpotlight(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Spotlights') || ss.getActiveSheet();
  sheet.appendRow([data.name, data.link, data.genre, data.note, new Date().toISOString()]);
  return jsonResponse({ result: 'success', message: 'Spotlight submitted' });
}

// ---- Send newsletter to all subscribers ----
function handleSendNewsletter(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return jsonResponse({ result: 'skip', message: 'No subscribers yet' });
  }

  var title = data.title || 'New Article';
  var excerpt = data.excerpt || '';
  var category = data.category || '';
  var url = data.url || 'https://soul465.github.io/the-night-owl/';

  var subject = 'The Midnight Drop — ' + title;

  var htmlBody = '<!DOCTYPE html>' +
    '<html><head><meta charset="utf-8"></head>' +
    '<body style="margin:0;padding:0;background:#0d0d1a;font-family:Georgia,serif;">' +
    '<div style="max-width:580px;margin:0 auto;padding:32px 20px;">' +

    // Header
    '<div style="text-align:center;padding:24px 0;border-bottom:1px solid #2a2a4a;">' +
    '<h1 style="margin:0;font-size:28px;color:#e8d5b7;letter-spacing:1px;">The Midnight Drop</h1>' +
    '<p style="margin:6px 0 0;font-size:13px;color:#8888aa;">from The Night Owl</p>' +
    '</div>' +

    // Category badge
    (category ? '<div style="text-align:center;padding:20px 0 0;">' +
    '<span style="display:inline-block;background:#a78bfa;color:#0d0d1a;font-size:11px;font-weight:bold;padding:4px 12px;border-radius:12px;text-transform:uppercase;letter-spacing:1px;">' + category + '</span>' +
    '</div>' : '') +

    // Title
    '<div style="padding:20px 0;">' +
    '<h2 style="margin:0;font-size:22px;color:#ffffff;line-height:1.4;text-align:center;">' + title + '</h2>' +
    '</div>' +

    // Excerpt
    (excerpt ? '<p style="margin:0 0 24px;font-size:15px;color:#ccccdd;line-height:1.6;text-align:center;">' + excerpt + '</p>' : '') +

    // CTA button
    '<div style="text-align:center;padding:8px 0 32px;">' +
    '<a href="' + url + '" style="display:inline-block;background:#a78bfa;color:#0d0d1a;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 32px;border-radius:8px;letter-spacing:0.5px;">Read the Full Article</a>' +
    '</div>' +

    // Footer
    '<div style="border-top:1px solid #2a2a4a;padding:20px 0;text-align:center;">' +
    '<p style="margin:0;font-size:12px;color:#666680;">You signed up for The Midnight Drop at The Night Owl.</p>' +
    '<p style="margin:8px 0 0;font-size:12px;color:#666680;">Built in Louisiana. &mdash; Cam / Gramercy</p>' +
    '</div>' +

    '</div></body></html>';

  var emails = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat().filter(String);
  var sent = 0;
  var failed = 0;

  emails.forEach(function(email) {
    try {
      GmailApp.sendEmail(email, subject, title + ' — ' + excerpt + '\n\nRead it: ' + url, {
        htmlBody: htmlBody,
        name: 'The Night Owl'
      });
      sent++;
    } catch (e) {
      Logger.log('Failed: ' + email + ' — ' + e.toString());
      failed++;
    }
  });

  Logger.log('Newsletter sent: ' + sent + ' success, ' + failed + ' failed');
  return jsonResponse({ result: 'success', sent: sent, failed: failed });
}

// ---- Manual send (run from script editor) ----
function sendNewsletter() {
  var title = 'YOUR ARTICLE TITLE HERE';
  var excerpt = 'YOUR EXCERPT HERE';
  var url = 'https://soul465.github.io/the-night-owl/articles/YOUR-SLUG.html';
  var category = 'Culture';

  handleSendNewsletter({ title: title, excerpt: excerpt, url: url, category: category });
}

// ---- Utility ----
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
