# Deploying MedAI

The prepared layout uses two Vercel projects (website and prediction API), one Render service for the existing Socket.IO server, and the existing Supabase database plus a private Storage bucket. See [deployment status](deploy/STATUS.md) for the resources already configured.

## 1. Connect accounts and storage

Sign in to Vercel and Render, or connect their integrations in Codex. Connect the existing Supabase project. Never paste secret keys into a chat or commit a filled environment file.

In Supabase Storage, create a **private** bucket named `medical-reports`. Allow `application/pdf`, `image/png`, and `image/jpeg`. Keep the bucket private and its upload limit at least 4 MB. Add the project URL and server-only legacy `service_role` API key to Vercel using the variable names in `deploy/website.env.example`.

Existing database reports that use `local:` or `/uploads/` refer to files on this computer. They must be migrated to private Storage, or re-uploaded, before they can be opened from the deployed site. Deployment does not erase these original files or database records.

## 2. Deploy the prediction API

Use `fastapi` as the Vercel project directory, select FastAPI, and use Python 3.13. The committed configuration runs `python verify_deployment.py` to check all three installed models. Enable Fluid compute and add `VERCEL_SUPPORT_LARGE_FUNCTIONS=1` to the Vercel project's Preview environment before deploying. The value in `vercel.json` alone did not enable the larger package limit during the cloud build. Add the project variable to Production before a production deployment too.

Deploy **from the local directory with the CLI**, because the installed model files are intentionally ignored by Git. The `.vercelignore` allowlist includes only the app, required configuration, and installed model artifacts. Research images, caches, checkpoint backups, environment files, and the virtual environment are excluded.

```powershell
cd fastapi
npx.cmd --yes vercel@64.7.0 login
npx.cmd --yes vercel@64.7.0 link --project medai-inference --scope puneet-s-projects46 --yes
# Set the server-only values from deploy/inference.env.example in this project.
npx.cmd --yes vercel@64.7.0 deploy --environment preview
```

Keep this API as a **separate project** from the website. Do not replace the existing website project link. Make the production API reachable by the website; its inference endpoints require `FASTAPI_SECRET`. Check `/health`: `symptom_predictor`, `chatbot`, and `xray_analyzer` must all be `true`.

Vercel's application bundle is read-only. In this configuration the deployed assistant answers questions using its installed model; assistant topic editing and retraining stay in the local environment. Train/edit locally and redeploy to apply changes. A persistent container backend is needed to retain editing/retraining inside the hosted admin console.

## 3. Deploy consultation chat

The root `render.yaml` defines `medai-consultation-chat`, a single free Node service. Import the current GitHub repository in Render as a Blueprint, after publishing the reviewed source changes. Alternatively create a Node web service with root `frontend`, build `npm ci`, and start `npm run socket`.

Set the values from `deploy/chat.env.example`. `SOCKET_SECRET` must match the website and `ALLOWED_ORIGINS` must contain the exact website origin. The server uses Render's `PORT` and listens on all interfaces. Check its `/health` endpoint. Keep one instance unless a shared Socket.IO adapter is added. Free instances can sleep, so the first connection may need a retry after waking.

Consultation messages are saved through the authenticated website before live notification. Both participants can send and receive saved messages during a chat-host outage; the room refreshes every three seconds while the live connection recovers. Retrying a message uses the same message ID to prevent duplicates. Deploy the latest socket server too so saved-message notifications arrive immediately.

## 4. Deploy the website

The existing local Vercel link is in `frontend/.vercel/project.json`. Use project root `frontend`, framework Next.js, Node 22, install `npm ci`, and build `npm run build`. Prisma Client is generated during installation for the cloud platform.

Set all values in `deploy/website.env.example` in the Vercel project's Preview and Production environments. Use the real prediction and chat HTTPS addresses, not localhost. Reuse the current Supabase connection string and website `AUTH_SECRET`; generate a separate random `SOCKET_SECRET` and share it with the chat service. If Google sign-in is enabled, update its authorized callback to `https://YOUR-WEBSITE/api/auth/callback/google`.

The Vercel upload configuration uses a **4 MB** report limit to stay below the platform's request limit. Local development defaults to 10 MB. Patient reports remain private; authorized cloud downloads use a 60-second signed URL. Private cloud storage is required on Vercel, because its filesystem is not permanent report storage.

```powershell
cd frontend
# With production environment variables available in this shell:
npm.cmd run deploy:check
npm.cmd run build
npx.cmd --yes vercel@64.7.0 deploy --environment preview
```

Review the preview before the final production command:

```powershell
npx.cmd --yes vercel@64.7.0 deploy --prod
```

Use the preview's protection controls when testing; the prediction service must be reachable by server-to-server requests. Do not make a private patient-report bucket public to resolve access errors.

## Verification

Check registration, each role's login, doctor approval, administrator invitations, a report upload/download, both public X-ray samples, symptom prediction, and a patient–doctor text consultation on the deployed URLs. Use synthetic test accounts and remove their records afterward. Local passing checks do not confirm a cloud deployment succeeded.

References: [Vercel FastAPI](https://vercel.com/docs/frameworks/backend/fastapi), [Large Functions](https://vercel.com/changelog/vercel-functions-can-now-be-up-to-5-gb-in-package-size), [function payload limits](https://vercel.com/docs/functions/limitations), [Render Blueprints](https://render.com/docs/blueprint-spec), [Supabase private Storage](https://supabase.com/docs/guides/storage).
