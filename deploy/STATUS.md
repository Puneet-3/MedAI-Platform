# MedAI deployment status

Updated 21 October 2026. Website release `6026d4d` is live on the production domain. The production build and six live workflow checks passed: sign-in, message access controls, safe retries, participant message delivery, real symptom prediction, and completed-room restrictions. Light/dark text contrast and chat scrolling passed browser checks. Render instant-chat authentication remains unresolved; authenticated website messages continue to arrive through the three-second automatic refresh.

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

Follow-up diagnosis: Vercel runtime logs showed Supabase `EMAXCONNSESSION` errors (session pool limit 15). The website database setting was switched to the verified transaction pooler on port 6543; Prisma queries and interactive transactions passed. The next website deployment applies this setting. Chat now records safe rejection codes and reports its deployed Git revision through `/health`, so missing Render logs and stale deployments can be distinguished. No credentials or patient identifiers are logged.

1. Keep the Supabase `medical-reports` bucket private and retain its server-only key in Vercel.
2. Resolve the existing Render `medai-socket` service's connection rejection. Its public URL is https://medai-socket.onrender.com . Health and transport handshakes respond, but a valid website participant token is rejected. Review Render logs and its deployed source, database URL, shared secret, and allowed origins. The website secret matches ignored `deploy/.env.hosting`; Render settings could not be inspected from this session.
3. Re-run `test:chat-workflow` with the production `SMOKE_URL` and Render `TEST_SOCKET_URL` after fixing Render. The six website checks passed; the additional instant-notification check has not passed against Render. Tests use synthetic accounts and messages and remove their records.
4. Migrate existing locally stored report files, or re-upload them, before expecting those reports to open online.

The dedicated chat secret is saved locally in ignored `deploy/.env.hosting`. Do not commit this file or paste its contents into chat. Original local development settings were not replaced.
