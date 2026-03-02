# Build Routine Dashboard

This repository is a Vite/React front-end application for tracking routines and nutrition. The project can be run locally in development or deployed for 24/7 availability.

## Running locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Development server (hot reload):
   ```bash
   npm run dev
   ```

## Building for production

```bash
npm run build
```

A `dist/` folder will be generated containing static assets.

## Keeping the app running 24/7

There are a couple of common approaches depending on where you host the app:

### Static hosting (GitHub Pages / Netlify / Vercel)

The repo already includes a `homepage` field and deploy scripts for GitHub Pages:

```json
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"
```

Run `npm run deploy` to publish the `dist` folder to GitHub Pages. Once deployed, the site will be available 24/7 as a static site without any additional server process.

_Note: replace `YOUR_GITHUB_USERNAME` in `package.json` with your GitHub username before deploying._

If you see a `gh-pages` file at the repository root after deploying, it is an accidental artifact; remove it locally and avoid committing it. Use `git rm gh-pages` if the file is tracked.

### Self‑hosted with a process manager (PM2)

If you prefer or require a Node server, a simple `server.js` has been added to serve the built files. To keep it running indefinitely:

1. Install `pm2` globally on your host machine:
   ```bash
   npm install -g pm2
   ```
2. Build the project (`npm run build`).
3. Start the server with PM2:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save          # saves the current process list for startup
   pm2 startup       # optionally configure pm2 to start on boot
   ```

The `ecosystem.config.js` is included and configures the app to restart automatically if it crashes.

You can also run the server manually with `npm start` (it simply runs `node server.js`), but PM2 ensures uptime and restart capability.

## Deploying to other platforms

- **Heroku / Render / Fly.io**: Push this repo and point to the `start` script.
- **Docker**: Build the static site and serve it with any web server image (e.g. nginx) or the provided `server.js` in a Node image.

> ⚠️ Development server (`npm run dev`) is not meant for production use. Always build before deploying.

---

Choose the strategy that fits your environment; either way, once deployed to a hosting provider or started with PM2, the application will be accessible around the clock.