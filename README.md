# Rowform

Rowform is a static website for turning Excel rows into Google Forms prefilled review links. It does not submit forms. The workbook is read in the browser and is never sent to the metadata backend.

## Use

1. Open `site/index.html` or the deployed GitHub Pages URL.
2. Choose an `.xlsx` or `.xls` workbook.
3. Paste a `forms.gle` share link, a full Google Forms link, or a prefilled link into Rowform.
4. For automatic question lookup, configure the Apps Script backend once (below). Without it, paste a **Get pre-filled link** from the same Form into the Field ID template input.
5. Map the detected questions to Excel columns and generate review links.
6. Open each link, review it, and submit it yourself in Google Forms.

## One-Time Backend Setup

GitHub Pages cannot read Google Forms question IDs directly because Google blocks cross-origin browser reads. The optional Google Apps Script endpoint resolves `forms.gle` redirects and returns only public question labels and `entry.*` IDs.

1. Open `script.google.com/new` while signed in to the Google account that will own the endpoint.
2. Copy `apps-script/Code.gs` into the script editor. In **Project Settings**, enable **Show "appsscript.json" manifest file** and replace the manifest contents with `apps-script/appsscript.json`.
3. Choose **Deploy → New deployment → Web app**. Set **Execute as** to **Me** and access to **Anyone**.
4. Deploy and approve the `UrlFetch` permission. Copy the web app URL ending in `/exec`.
5. In Rowform, expand **Automatic field lookup setup**, paste the `/exec` URL, and save it. It is stored only in that browser.

The endpoint accepts only `forms.gle` and `docs.google.com/forms` URLs, follows a limited number of redirects, and reads public Forms only. It receives the Form URL, not the Excel workbook or answers. It is public and uses the owner's Apps Script quota; Google Workspace policy may prevent access for “Anyone”. If a Form requires sign-in, use the manual prefilled-link fallback.

The workbook and generated links may contain personal data. Keep them private and do not commit the workbook. The root `data.xlsx` is ignored by Git.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` publishes only `site/`; it does not publish the root Python script, config, or workbook.

1. Create a GitHub repository and add `site/index.html` and `.github/workflows/pages.yml` (and optionally this README and `.gitignore`). Do not upload `data.xlsx`.
2. In the repository, open **Settings → Pages** and choose **GitHub Actions** as the build and deployment source.
3. Push to `main` or `master`, or run **Deploy Rowform to GitHub Pages** from the **Actions** tab.
4. GitHub will show the live URL in the completed deployment and in **Settings → Pages**.

The published page loads SheetJS from jsDelivr, so an internet connection is needed to read Excel workbooks.