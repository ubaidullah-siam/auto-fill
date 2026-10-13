# Rowform

Rowform is a static, browser-only helper for turning Excel rows into Google Forms prefilled review links. It does not submit forms. The workbook is read in the browser and is not uploaded to a server.

## Use

1. Open `site/index.html` or the deployed GitHub Pages URL.
2. Choose an `.xlsx` or `.xls` workbook.
3. In Google Forms, use **Get pre-filled link** with sample answers, then paste that URL into Rowform.
4. Map each `entry.*` field to an Excel column and generate review links.
5. Open each link, review it, and submit it yourself in Google Forms.

The workbook and generated links may contain personal data. Keep them private and do not commit the workbook. The root `data.xlsx` is ignored by Git.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` publishes only `site/`; it does not publish the root Python script, config, or workbook.

1. Create a GitHub repository and add `site/index.html` and `.github/workflows/pages.yml` (and optionally this README and `.gitignore`). Do not upload `data.xlsx`.
2. In the repository, open **Settings → Pages** and choose **GitHub Actions** as the build and deployment source.
3. Push to `main` or `master`, or run **Deploy Rowform to GitHub Pages** from the **Actions** tab.
4. GitHub will show the live URL in the completed deployment and in **Settings → Pages**.

The published page loads SheetJS from jsDelivr, so an internet connection is needed to read Excel workbooks.