# Rowform

Rowform is a static, browser-only helper for turning Excel rows into Google Forms prefilled review links. It does not submit forms. The workbook is read in the browser and is not uploaded to a server.

## Use

1. Open `site/index.html` or the deployed GitHub Pages URL.
2. Choose an `.xlsx` or `.xls` workbook.
3. Paste a `forms.gle` share link, a full Google Forms link, or a prefilled link into Rowform.
4. With the backend enabled, Rowform looks up public Form question IDs automatically. Without it, add a **Get pre-filled link** from the same Form in the Field ID template input.
5. Map each question to an Excel column and generate review links.
6. Open each link, review it, and submit it yourself in Google Forms.

Regular and short share links do not expose question IDs to a browser-only site. The optional Apps Script backend in `apps-script/Code.gs` resolves public Google Forms links and reads their public question IDs. It never receives the workbook or submits responses. Forms requiring sign-in, private access, CAPTCHA, or organization authorization cannot be inspected this way.

## Enable Automatic Form Lookup

The Apps Script backend must be deployed once from a Google account:

1. Create a project at [script.google.com](https://script.google.com/) and paste `apps-script/Code.gs` into `Code.gs`.
2. Choose **Deploy → New deployment → Web app**. Set **Execute as** to your account and **Who has access** to **Anyone**, then authorize the external-request permission.
3. Copy the deployed `/exec` URL. The endpoint only fetches allowlisted Google Forms pages and caches question metadata; it does not accept workbook data or submit responses.
4. Set that URL as `FORM_RESOLVER_API_URL` near the top of the script in `site/index.html`, then push the website update. After this one-time setup, a regular or `forms.gle` link can be inspected without entering a second template URL.

Apps Script quotas apply. If Workspace policy blocks public Web Apps, the resolver must instead be deployed on a serverless host you control.

The workbook and generated links may contain personal data. Keep them private and do not commit the workbook. The root `data.xlsx` is ignored by Git.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` publishes only `site/`; it does not publish the root Python script, config, or workbook.

1. Create a GitHub repository and add `site/index.html` and `.github/workflows/pages.yml` (and optionally this README and `.gitignore`). Do not upload `data.xlsx`.
2. In the repository, open **Settings → Pages** and choose **GitHub Actions** as the build and deployment source.
3. Push to `main` or `master`, or run **Deploy Rowform to GitHub Pages** from the **Actions** tab.
4. GitHub will show the live URL in the completed deployment and in **Settings → Pages**.

The published page loads SheetJS from jsDelivr, so an internet connection is needed to read Excel workbooks.