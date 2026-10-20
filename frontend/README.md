# MedAI web application

See [the project README](../README.md) for setup, environment variables, model training, roles, and verification.

```powershell
npm.cmd run dev:all   # start web, chat, and FastAPI
npm.cmd run db:check
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run smoke     # requires the web service
npm.cmd run smoke:workflows  # creates and cleans synthetic records against the configured DB
npm.cmd run smoke:xray      # also verifies screening of both public X-ray samples
```
