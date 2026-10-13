const MAX_FORM_REDIRECTS = 6;

function doGet(event) {
  const callback = String(event.parameter && event.parameter.callback || "");
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(callback)) {
    return ContentService.createTextOutput("Invalid callback")
      .setMimeType(ContentService.MimeType.TEXT);
  }

  try {
    const requestedUrl = String(event.parameter.url || "");
    const formUrl = resolveFormUrl(requestedUrl);
    const response = UrlFetchApp.fetch(formUrl, {
      followRedirects: false,
      muteHttpExceptions: true
    });
    if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
      throw new Error("The Form is not publicly accessible.");
    }

    const match = response.getContentText().match(/FB_PUBLIC_LOAD_DATA_\s*=\s*([\s\S]*?);<\/script>/);
    if (!match) throw new Error("Google Forms metadata was not found.");

    const data = JSON.parse(match[1]);
    const questions = data && data[1] && data[1][1];
    if (!Array.isArray(questions)) throw new Error("Google Forms metadata has an unexpected format.");

    const seen = {};
    const fields = [];
    questions.forEach(function (question) {
      if (!question || !question[4] || !question[4][0]) return;
      const entry = "entry." + question[4][0][0];
      if (seen[entry]) return;
      seen[entry] = true;
      fields.push({ entry: entry, label: String(question[1] || entry) });
    });
    if (!fields.length) throw new Error("No fillable questions were found.");

    return jsonp(callback, {
      ok: true,
      formUrl: formUrl.split("?")[0],
      fields: fields
    });
  } catch (error) {
    return jsonp(callback, {
      ok: false,
      error: String(error && error.message || "Form lookup failed.")
    });
  }
}

function resolveFormUrl(inputUrl) {
  let currentUrl = inputUrl;
  for (let redirectCount = 0; redirectCount <= MAX_FORM_REDIRECTS; redirectCount += 1) {
    validateFormUrl(currentUrl);
    const response = UrlFetchApp.fetch(currentUrl, {
      followRedirects: false,
      muteHttpExceptions: true
    });
    const status = response.getResponseCode();
    if ([301, 302, 303, 307, 308].indexOf(status) >= 0) {
      if (redirectCount === MAX_FORM_REDIRECTS) throw new Error("Too many Form redirects.");
      const headers = response.getHeaders();
      const location = headers.Location || headers.location;
      if (!location) throw new Error("The Form redirect did not include a destination.");
      currentUrl = resolveLocation(currentUrl, String(location));
      continue;
    }
    if (status < 200 || status >= 300) throw new Error("The Form is not publicly accessible.");
    return currentUrl;
  }
  throw new Error("The Form could not be resolved.");
}

function validateFormUrl(value) {
  const match = String(value).match(/^https:\/\/([^/?#]+)([^?#]*)/i);
  if (!match) throw new Error("Only HTTPS Google Forms links are supported.");
  const host = match[1].toLowerCase();
  const path = match[2];
  if (host === "forms.gle") return;
  if (host === "docs.google.com" && path.indexOf("/forms/") === 0) return;
  throw new Error("Only forms.gle and docs.google.com/forms links are supported.");
}

function resolveLocation(currentUrl, location) {
  if (/^https:\/\//i.test(location)) return location;
  if (location.indexOf("//") === 0) return "https:" + location;
  const origin = currentUrl.match(/^https:\/\/[^/]+/i)[0];
  if (location.indexOf("/") === 0) return origin + location;
  const basePath = currentUrl.replace(/[?#].*$/, "").replace(/[^/]*$/, "");
  return basePath + location;
}

function jsonp(callback, payload) {
  return ContentService.createTextOutput(callback + "(" + JSON.stringify(payload) + ");")
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}