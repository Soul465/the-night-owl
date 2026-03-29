# The Midnight Drop — Email List Setup

## Step 1: Create the Google Sheet

1. Go to Google Sheets and create a new spreadsheet
2. Name it **"The Midnight Drop — Subscribers"**
3. In Row 1, add these headers:
   - A1: `Email`
   - B1: `Date Signed Up`
4. Copy the **spreadsheet ID** from the URL — it's the long string between `/d/` and `/edit`
   Example: `https://docs.google.com/spreadsheets/d/THIS_PART_HERE/edit`

## Step 2: Add the Google Apps Script

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete any code in the editor
3. Paste this entire script:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    var email = data.email;

    // Check for duplicate
    var emails = sheet.getRange("A:A").getValues().flat();
    if (emails.includes(email)) {
      return ContentService
        .createTextOutput(JSON.stringify({ result: "duplicate", message: "Already subscribed" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Add new subscriber
    sheet.appendRow([email, new Date().toISOString()]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success", message: "Subscribed" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Send an email to all subscribers
function sendNewsletter() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    Logger.log("No subscribers yet");
    return;
  }

  // Edit these before running
  var subject = "The Midnight Drop — [Your Subject Here]";
  var htmlBody = "<h2>The Midnight Drop</h2><p>Your newsletter content here...</p><p>— Cam / Gramercy</p><hr><p style='font-size:12px;color:#888;'>You signed up at The Night Owl. <a href='https://soul465.github.io/the-night-owl/'>Visit the blog</a></p>";

  var emails = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat().filter(String);
  var sent = 0;

  emails.forEach(function(email) {
    try {
      GmailApp.sendEmail(email, subject, "", { htmlBody: htmlBody, name: "The Night Owl" });
      sent++;
    } catch (e) {
      Logger.log("Failed to send to: " + email + " — " + e.toString());
    }
  });

  Logger.log("Sent to " + sent + " out of " + emails.length + " subscribers");
}
```

4. Click **Save** (Ctrl+S)
5. Name the project: **"Midnight Drop Backend"**

## Step 3: Deploy the Script

1. Click **Deploy → New deployment**
2. Click the gear icon next to "Select type" → choose **Web app**
3. Set:
   - Description: `Midnight Drop signup`
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**
5. Authorize it when prompted (click through the "unsafe" warning — it's your own script)
6. **Copy the Web app URL** — it looks like:
   `https://script.google.com/macros/s/LONG_ID_HERE/exec`

## Step 4: Give the URL to Claude

Paste that Web app URL in the chat and I'll wire it into your site's newsletter form.

## How to Send a Newsletter

1. Open the Google Sheet
2. Go to **Extensions → Apps Script**
3. Edit the `subject` and `htmlBody` in the `sendNewsletter` function
4. Select `sendNewsletter` from the function dropdown at the top
5. Click **Run**
6. It sends to every email in your sheet

**Gmail limit:** 100 emails/day on a free Google account. More than enough to start.

## How to See Your Subscribers

Just open the Google Sheet. Every signup shows the email and the date they joined.
