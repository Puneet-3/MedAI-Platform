# MedAI

For cloud setup, see [Deploying MedAI](DEPLOYMENT.md). Website and prediction-service Vercel configurations, a Render chat Blueprint, and secret-free environment templates are included. Publishing requires connected hosting accounts and private report Storage configuration.

A healthcare software project that keeps symptom checks, medical reports, and doctor conversations together. Built with Next.js 16, React 19, TypeScript, PostgreSQL/Prisma, Socket.IO, and FastAPI.

MedAI is experimental software for learning and demonstration. Its models have not been clinically validated. Model match scores are not disease probabilities, and the application is not an emergency service.

## What works

- Patient, Doctor, or Administrator selection during registration and password sign-in. Administrator registration requires an invitation. Google sign-in is available when configured.
- Doctor registration requests stay at patient access until an administrator verifies and approves them; administrators can also decline requests.
- Patient, doctor, and administrator workspaces with server-side access checks.
- Symptom prediction from a trained Random Forest model, with saved history.
- An intent-based assistant with prepared responses and a fallback for unfamiliar questions.
- A doctor waiting room, authenticated text consultations, persisted messages, treatment notes, and paginated PDF exports.
- JPG, PNG, and PDF report uploads up to 10 MB; private local or Supabase storage; authenticated downloads and doctor reviews.
- Experimental pediatric chest X-ray screening with a trained MobileNetV2 classifier, saved model scores, and doctor review.
- Nearby hospital, clinic, and pharmacy search. Google Maps search works without an API key; directory cards require a Google Places key. No simulated facilities are shown.
- Account name/password editing and administrator role/assistant management.

There is no video calling, payment processing, paid plan, verified digital signature, or automatic doctor credential verification. Doctor access must be granted by an administrator.

## Local setup

Use Node.js 22.12+ and Python 3.13. The Python dependency versions match the existing local environment; use matching versions when loading saved sklearn models.

1. Copy `frontend/.env.example` to `frontend/.env`, and `fastapi/.env.example` to `fastapi/.env`. Keep any existing `.env` files. Fill in `DATABASE_URL`, `AUTH_SECRET`, and `FASTAPI_SECRET`; the FastAPI secret must match in both files. Generate a secret with:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. Install the web dependencies and initialise an empty development database:

   ```powershell
   cd frontend
   npm.cmd install
   npx.cmd prisma generate
   npx.cmd prisma db push
   ```

   Use a PostgreSQL database you own. Inspect schema changes before applying `db push` to an existing database. For Supabase, use the connection details shown in your project's Connect panel; a transaction pooler commonly uses a `postgres.<project-reference>` username. URL-encode special characters in passwords.

   When updating an existing MedAI database, `node scripts/apply-doctor-request-schema.cjs` adds only the pending doctor request field. Then run `npx.cmd prisma generate`. The patch preserves existing account roles.

3. Set up the inference service:

   ```powershell
   cd ..\fastapi
   py -3.13 -m venv venv
   .\venv\Scripts\python.exe -m pip install -r requirements.txt
   .\venv\Scripts\python.exe train.py
   .\venv\Scripts\python.exe train_chatbot.py
   ```

   `train.py` requires `fastapi/dataset/Training.csv`. Existing local model artifacts can be reused. Only load pickle artifacts from a trusted source.

4. Start all three services:

   ```powershell
   cd ..\frontend
   npm.cmd run dev:all
   ```

   Open **http://localhost:3000**. Chat uses port 3001 and FastAPI uses port 8080. `GET http://localhost:8080/health` reports which models are actually available. `degraded` means one or more optional model capabilities are missing.

   Alternatively run `npm.cmd run dev` and `npm.cmd run socket` in separate terminals inside `frontend`. From the project root, run `fastapi/venv/Scripts/python.exe -m uvicorn main:app --app-dir fastapi --port 8080` in a third terminal.

## Doctor and administrator access

Registration offers Patient, Doctor, and Administrator. A Doctor choice records a pending request; it does not grant clinical access. At sign-in, select the role matching your account. Doctor applicants select Doctor and enter a dedicated **Doctor registration** page with an **Approval pending** status and a **Check approval** button. In the administrator's User Directory, verify professional credentials before choosing **Approve doctor access**, or choose **Decline request**. Approved applicants enter the doctor workspace; declined applicants sign in as Patient. The server checks the selected role against the current database role and registration status.

For a new administrator account, an existing administrator opens **Administration → User Directory → Invite an administrator**, enters the new email, and creates an invitation. Share the code privately with the intended recipient. The recipient selects **Administrator** during registration and uses the same email and code. Codes are signed using the server's `AUTH_SECRET`, expire after 24 hours, and cannot register a different email. An email can register only once. Invitations are displayed for the administrator to share; the app does not send email.

To bootstrap the first administrator, create an account, then assign its role from a trusted terminal in `frontend`:

```powershell
npm.cmd run user:role -- your-email@example.com ADMIN
npm.cmd run user:role -- doctor-email@example.com DOCTOR
```

The first command bootstraps the first administrator. Afterwards, an administrator can grant or remove doctor access and invite new administrators in the app. Uninvited registration cannot assign clinical or administrator privileges.

## X-ray screening

Screening requires a trained checkpoint with verified class order, matching preprocessing, and calibration settings. Missing or incompatible checkpoints leave automated screening unavailable while reports remain accessible for doctor review.

The training pipeline uses the official **PneumoniaMNIST-224** research dataset. Its download is verified against the publisher's checksum. Exact duplicate copies that overlap other partitions are excluded from fitting; the original test partition is retained. Data is not reassigned between partitions.

To reproduce the training run:

```powershell
cd fastapi
.\venv\Scripts\python.exe download_xray_dataset.py
.\venv\Scripts\python.exe train_cnn.py --data dataset/pneumoniamnist/pneumoniamnist_224.npz --epochs 60 --threads 4
```

Training reuses ImageNet MobileNetV2 features and fits a two-class head. Model selection and temperature calibration use validation data only. The test set is evaluated afterwards, with accuracy, AUROC, class-specific recall/specificity, a confusion matrix, and bootstrap intervals saved to `fastapi/model_report/evaluation.json`. `MODEL_CARD.md` records scope, provenance, preprocessing, and limitations. The previous checkpoint is backed up before a verified export is installed.

For a different labelled dataset, `--data` can point to a folder containing `train/NORMAL`, `train/PNEUMONIA`, `val/NORMAL`, `val/PNEUMONIA`, `test/NORMAL`, and `test/PNEUMONIA`. Folder datasets must provide their own population and licence documentation.

The evaluated population is pediatric chest radiographs. Adult imaging, unrelated diseases, other hospitals, and arbitrary photographs are outside the evaluated scope. A model label or score is not a clinical diagnosis; a doctor must review it. Dataset benchmark scores do not establish clinical validity.

The two public images under `fastapi/demo_xrays/` are selected by dataset order, not by whether the model gets them right. They can be uploaded in the reports page to demonstrate the flow. Their source, reference labels, and licence are recorded alongside them.

After installing a checkpoint, restart FastAPI and check `/health`. From `frontend`, `npm.cmd run smoke:xray` exercises real screening, persistence, and doctor review of both public images using temporary synthetic accounts, then cleans its own records. Model weights, downloaded images, and feature caches are excluded from Git; retain the trained `xray_model.pth` when copying this project to another machine.

## Report storage

Without Supabase credentials, reports are stored under `frontend/storage/reports`, outside the public directory. Back up that directory together with the database. Local storage requires a persistent filesystem and is unsuitable for ephemeral serverless instances.

For Supabase, create a **private** `medical-reports` bucket and set the storage variables in `frontend/.env`. Only the server receives the service role key. The database stores object references; the application authorises each download, so report links do not expire after an hour. Old local uploads are blocked from direct public access and remain readable through the authorised report endpoint. Old signed Supabase URLs are resolved back to their object names.

Doctors share the report-review queue in this demonstration project. A real deployment needs an institution-specific patient assignment and consent policy, credential verification, audit records, and clinical validation before handling real patient care.

## Validation

```powershell
cd frontend
npm.cmd run db:check   # read-only connection and required-column check
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run smoke   # web service must be running
npm.cmd run smoke:socket   # socket service must be running
npm.cmd run smoke:workflows   # live services and DB; creates and cleans its own synthetic records
cd ..\fastapi
.\venv\Scripts\python.exe -m unittest -v test_main test_xray
```

The smoke suite checks public pages, sign-in redirects, report access controls, blocked public uploads, and invalid registration. Backend checks cover real symptom inference, request validation, authentication, unfamiliar chatbot input, duplicate intent tags, and unavailable models.

The signed-in workflow suite creates clearly marked synthetic accounts and exercises administrator invitations and protected registration, doctor request approval/rejection, normalized-email login with role selection, account editing, real symptom inference, report upload/download/review, consultation acceptance, live chat, sender identity checks, completion, administrator controls, and protected pages against the configured database. Its cleanup is limited to the exact accounts and files created by that run; existing accounts and records are not modified.

## Verified setup status

The resumed Supabase database is reachable, and all five MedAI tables contain the required columns, including the doctor request field. The signed-in workflow checks cover pending doctor access, administrator approval/rejection, and protected workspaces. Real X-ray upload and doctor review checks have also passed. Temporary test accounts, files, and related records were removed. Existing account roles and credentials were not changed. The frontend passes lint, type checking, and its production build. All 19 backend checks pass, and all three inference models load successfully.

The experimental X-ray checkpoint is trained and installed. After removing 26 repeated training images, it used 4,682 fitting images, 524 validation images, and 624 held-out test images. Test accuracy was 90.71%, AUROC 0.9780, pneumonia recall 99.23%, and normal specificity 76.50%. The confusion matrix contains 55 false positives and 3 false negatives. These are pediatric research benchmark results, not evidence of clinical validity. See [the model card](fastapi/model_report/MODEL_CARD.md) and [full evaluation](fastapi/model_report/evaluation.json).
