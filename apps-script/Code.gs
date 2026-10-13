const ROWFORM_CACHE_SECONDS = 21600;
const ROWFORM_MAX_URL_LENGTH = 2048;
const ROWFORM_MAX_REDIRECTS = 5;
const ROWFORM_MAX_HTML_LENGTH = 2500000;

function doGet(event) {
  const callback = String(event.parameter.callback || "");
  const requestId = String(event.parameter.requestId || "");
  const legacyCallbackValid = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(callback);
  const requestIdValid = /^[a-zA-Z0-9_-]{1,64}$/.test(requestId);
  if (!legacyCallbackValid && !requestIdValid) {
    return ContentService.createTextOutput("Invalid callback").setMimeType(ContentService.MimeType.TEXT);
  }

  try {
    return respond(callback, requestId, inspectForm(event.parameter.url || ""));
  } catch (error) {
    return respond(callback, requestId, { ok: false, error: error.message || "INSPECTION_FAILED" });
  }
}

function respond(callback, requestId, result) {
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(callback)) {
    return jsonpCallback(callback, result);
  }
  return jsonp(requestId, result);
}

function inspectForm(input) {
  const rawUrl = String(input).trim();
  if (!rawUrl || rawUrl.length > ROWFORM_MAX_URL_LENGTH) {
    throw new Error("INVALID_URL");
  }

  const inputParts = parseUrl(rawUrl);
  if (!isAllowedHost(inputParts.host)) {
    throw new Error("INVALID_URL");
  }

  const cacheKey = "form_" + Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, normalizeUrl(rawUrl))
  );
  const cache = CacheService.getScriptCache();
  const cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const fetched = fetchFormPage(rawUrl);
  const canonicalUrl = toCanonicalViewUrl(fetched.url);
  if (fetched.html.length > ROWFORM_MAX_HTML_LENGTH) {
    throw new Error("FORM_TOO_LARGE");
  }

  const metadataMatch = fetched.html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(.*?);\s*<\/script>/s);
  if (!metadataMatch) throw new Error("FORM_NOT_PUBLIC");

  let data;
  try {
    data = JSON.parse(metadataMatch[1]);
  } catch (error) {
    throw new Error("FORM_METADATA_INVALID");
  }

  const questions = data && data[1] && data[1][1];
  if (!Array.isArray(questions)) throw new Error("FORM_METADATA_INVALID");

  const fields = [];
  questions.forEach((question) => {
    if (!Array.isArray(question) || !Array.isArray(question[4])) return;
    const entryId = question[4][0] && question[4][0][0];
    if (entryId === undefined || entryId === null) return;
    const label = String(question[1] || "").trim();
    fields.push({
      entry: "entry." + String(entryId),
      label: label || "Google Forms field"
    });
  });

  if (!fields.length) throw new Error("FORM_NO_QUESTIONS");
  const result = { ok: true, formUrl: canonicalUrl, fields: fields };
  cache.put(cacheKey, JSON.stringify(result), ROWFORM_CACHE_SECONDS);
  return result;
}

function fetchFormPage(inputUrl) {
  let currentUrl = inputUrl;

  for (let attempt = 0; attempt <= ROWFORM_MAX_REDIRECTS; attempt += 1) {
    const parts = parseUrl(currentUrl);
    if (!isAllowedHost(parts.host)) throw new Error("REDIRECT_NOT_ALLOWED");

    const response = UrlFetchApp.fetch(currentUrl, {
      method: "get",
      followRedirects: false,
      muteHttpExceptions: true
    });
    const code = response.getResponseCode();

    if (code >= 300 && code < 400) {
      if (attempt === ROWFORM_MAX_REDIRECTS) throw new Error("TOO_MANY_REDIRECTS");
      const location = getHeader(response.getHeaders(), "location");
      if (!location) throw new Error("REDIRECT_LOCATION_MISSING");
      currentUrl = resolveLocation(currentUrl, location);
      continue;
    }

    if (code === 401 || code === 403) throw new Error("FORM_REQUIRES_ACCESS");
    if (code !== 200) throw new Error("FORM_FETCH_FAILED");
    if (parts.host !== "docs.google.com") throw new Error("FORM_REDIRECT_FAILED");

    return { url: currentUrl, html: response.getContentText() };
  }

  throw new Error("TOO_MANY_REDIRECTS");
}

function parseUrl(value) {
  const match = String(value).match(/^https:\/\/([^/?#]+)([^?#]*)(?:\?([^#]*))?(?:#.*)?$/i);
  if (!match) throw new Error("INVALID_URL");
  return {
    host: match[1].toLowerCase(),
    path: match[2] || "/"
  };
}

function isAllowedHost(host) {
  return host === "forms.gle" || host === "docs.google.com";
}

function normalizeUrl(value) {
  const parts = parseUrl(value);
  return "https://" + parts.host + parts.path;
}

function resolveLocation(currentUrl, location) {
  const target = String(location).trim();
  if (/^https:\/\//i.test(target)) return target;
  if (target.indexOf("//") === 0) return "https:" + target;

  const parts = parseUrl(currentUrl);
  if (target.charAt(0) === "/") return "https://" + parts.host + target;
  if (target.charAt(0) === "?") return currentUrl.split("?")[0] + target;
  return currentUrl.replace(/[^/]*(?:\?.*)?$/, "") + target;
}

function toCanonicalViewUrl(value) {
  const parts = parseUrl(value);
  if (parts.host !== "docs.google.com") throw new Error("FORM_REDIRECT_FAILED");
  const normalizedPath = parts.path.replace(/^\/forms\/u\/\d+(?=\/)/, "/forms");
  const match = normalizedPath.match(/^\/forms\/(d\/(?:e\/)?[^/]+)(?:\/(?:viewform|edit|preview))?/);
  if (!match) throw new Error("FORM_URL_UNSUPPORTED");
  return "https://docs.google.com/forms/" + match[1] + "/viewform";
}

function getHeader(headers, name) {
  const expected = name.toLowerCase();
  const key = Object.keys(headers).find((header) => header.toLowerCase() === expected);
  return key ? String(headers[key]) : "";
}

function jsonp(requestId, result) {
  const safeId = /^[a-zA-Z0-9_-]{1,64}$/.test(requestId) ? requestId : "invalid";
  const body = "window.rowformResolverCallback(" + JSON.stringify(safeId) + "," + JSON.stringify(result) + ");";
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function jsonpCallback(callback, result) {
  const body = callback + "(" + JSON.stringify(result) + ");";
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JAVASCRIPT);
}