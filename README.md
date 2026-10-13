# Rowform

Rowform is a static front end for turning Excel rows into Google Forms prefilled review links. Excel stays in the browser; only a Google Form URL is sent to the optional Apps Script resolver to look up public question IDs. Rowform never submits forms.

## Use

1. Open `site/index.html` or the deployed GitHub Pages URL.
2. Choose an `.xlsx` or `.xls` workbook.
3. Paste a `forms.gle` share link, a full Google Forms link, or a prefilled link into Rowform.
4. After the one-time backend setup, save its `/exec` URL in **Automatic field lookup setup**. Public Form IDs are then looked up automatically. Without a backend, add a **Get pre-filled link** from the same Form in the Field ID template input.
5. Map each question to an Excel column and generate review links.
6. Open each link, review it, and submit it yourself in Google Forms.

Regular and short share links do not expose question IDs to a browser-only site. The optional Apps Script backend in `apps-script/Code.gs` resolves public Google Forms links and reads their public question IDs. It never receives the workbook or submits responses. Forms requiring sign-in, private access, CAPTCHA, or organization authorization cannot be inspected this way.

## Enable Automatic Form Lookup

The Apps Script backend must be deployed once from a Google account:

1. Create a project at [script.google.com](https://script.google.com/) and paste `apps-script/Code.gs` into `Code.gs`.
2. Choose **Deploy → New deployment → Web app**. Set **Execute as** to your account and **Who has access** to **Anyone**, then authorize the external-request permission.
3. Copy the deployed `/exec` URL. The endpoint only fetches allowlisted Google Forms pages and caches question metadata; it does not accept workbook data or submit responses.
4. Open the live Rowform site, expand **Automatic field lookup setup**, paste the `/exec` URL, and press **Save URL**. It is stored only in that browser, so no source edit or GitHub push is needed.

Apps Script quotas apply. If Workspace policy blocks public Web Apps, the resolver must instead be deployed on a serverless host you control.

The workbook and generated links may contain personal data. Keep them private and do not commit the workbook. The root `data.xlsx` is ignored by Git.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` publishes only `site/`; it does not publish the root Python script, config, or workbook.

1. Create a GitHub repository and add `site/index.html` and `.github/workflows/pages.yml` (and optionally this README and `.gitignore`). Do not upload `data.xlsx`.
2. In the repository, open **Settings → Pages** and choose **GitHub Actions** as the build and deployment source.
3. Push to `main` or `master`, or run **Deploy Rowform to GitHub Pages** from the **Actions** tab.
4. GitHub will show the live URL in the completed deployment and in **Settings → Pages**.

The published page loads SheetJS from jsDelivr, so an internet connection is needed to read Excel workbooks.