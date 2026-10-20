# MedAI deployment status

Updated 21 October 2026. The website and prediction API have production deployments. Chat reliability and readability fixes are being verified for the next website release.

## Vercel

- Team: `puneet-s-projects46` (Hobby).
- Production website: existing `med-ai` project, connected to GitHub with root `frontend`. Public domain: https://v0-med-ai-p.vercel.app . The older local `frontend/.vercel/project.json` points to a different project named `frontend`; use the explicit project name `med-ai` for website deployment commands.
- Website Preview secrets added: `DATABASE_URL`, `AUTH_SECRET`, `FASTAPI_SECRET`, `SOCKET_SECRET`. Their values are not stored in this document.
- Prediction API: separate `medai-inference` project, linked by `fastapi/.vercel/project.json`, with FastAPI and Fluid compute enabled.
- Prediction Preview settings added: secret `FASTAPI_SECRET`, config `VERCEL_SUPPORT_LARGE_FUNCTIONS=1`.
- Prediction production domain: https://medai-inference.vercel.app . All three models load successfully. The shared production `FASTAPI_SECRET` has been synchronized between the website and prediction service.
- Prediction previews require Vercel sign-in; the production domain is reachable by the website using `FASTAPI_SECRET`.

The first prediction upload failed the package-size check. The subsequent production upload succeeded with large functions enabled.

## Remaining work

1. Keep the Supabase `medical-reports` bucket private and retain its server-only key in Vercel.
2. Keep the existing Render `medai-socket` service on the latest GitHub source. Its public URL is https://medai-socket.onrender.com . Its shared secret must match the website; allowed origins include the exact website domain.
3. Verify the website release against real prediction and chat endpoints after publishing. Automated tests use only synthetic accounts and messages, then remove their records.
4. Migrate existing locally stored report files, or re-upload them, before expecting those reports to open online.

The dedicated chat secret is saved locally in ignored `deploy/.env.hosting`. Do not commit this file or paste its contents into chat. Original local development settings were not replaced.
