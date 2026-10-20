# MedAI deployment status

Updated 20 October 2026. The current website changes have not been deployed.

## Vercel

- Team: `puneet-s-projects46` (Hobby).
- Website: existing `frontend` project, linked by `frontend/.vercel/project.json`. Configured for Node 22 and Next.js.
- Website Preview secrets added: `DATABASE_URL`, `AUTH_SECRET`, `FASTAPI_SECRET`, `SOCKET_SECRET`. Their values are not stored in this document.
- Prediction API: separate `medai-inference` project, linked by `fastapi/.vercel/project.json`, with FastAPI and Fluid compute enabled.
- Prediction Preview settings added: secret `FASTAPI_SECRET`, config `VERCEL_SUPPORT_LARGE_FUNCTIONS=1`.
- Latest prediction preview: https://medai-inference-ipmcgb4ez-puneet-s-projects46.vercel.app
- Build logs confirm all three trained models load and the Large Functions package builds. Deployment output is still being processed; readiness must be checked before using the URL.
- Prediction previews require Vercel sign-in. Server-to-server access must be configured before connecting the website to a protected API preview.

The first prediction upload was automatically assigned to Production by Vercel, but failed the package-size check. It did not publish a working API. Later uploads explicitly target Preview.

## Remaining work

1. Connect the existing Supabase project and create or verify the private `medical-reports` bucket. Configure its server-only Storage key and URL on the website.
2. Connect Render, deploy `medai-consultation-chat`, and configure its database, shared chat secret, and allowed website origins.
3. Configure the real prediction/chat addresses and the website authentication origin. Confirm protected API access works from the website server.
4. Migrate existing locally stored report files, or re-upload them, before expecting those reports to open online.
5. Deploy and review the website preview, then explicitly promote the reviewed application to Production.

The dedicated chat secret is saved locally in ignored `deploy/.env.hosting`. Do not commit this file or paste its contents into chat. Original local development settings were not replaced.
