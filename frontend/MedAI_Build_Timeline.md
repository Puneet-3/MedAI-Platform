# MedAI — Build Timeline
**Project:** Smart Health Consultation Platform  
**Stack:** Next.js 14 + TypeScript + Tailwind CSS + FastAPI + PyTorch + scikit-learn + Supabase  
**Duration:** 4 weeks (Jul 12 – Aug 7, 2026)  
**Builder:** Puneet (writes all code manually, uses Antigravity for guidance)

---

## Ground rules for Antigravity

- I write every line myself. Do NOT auto-complete full files unprompted.
- Explain the concept + the "why" before showing any code snippet.
- If I paste broken code, ask me to debug it first before giving the fix.
- If my approach risks bad architecture, stop me immediately.
- Keep responses tight — I'm a final-year CSE (AI/ML) student, skip the basics.
- When I finish a day's task, ask me one question to verify I understood what I built.

---

## Daily time slots (weekdays)

| Slot | Time | Use |
|---|---|---|
| Morning | 11AM – 12PM | Light tasks: reading docs, reviewing yesterday's code, planning |
| Evening | 7PM – 8:30PM | Main build session |
| Night | 9PM – 1:30AM | **GRIND.DEV only (DSA/placement prep) — no project work** |

**Weekends:** 10AM – 2PM (project sprint, ~4 hours)

---

## Placement blackouts — no project work these days

| Dates | Event |
|---|---|
| Jul 10–11 (Fri–Sat) | Visteon placement drive — VIT Chennai |
| Jul 16–17 (Thu–Fri) | Value Labs placement drive — VIT Vellore |

---

## Week 1 — Foundation (Jul 12–15)
**Goal:** Project scaffold, auth system, FastAPI boilerplate, DB schema live on Supabase.

---

### Day 1 — Jul 12 (Sunday) · 4 hrs
**Theme: Project setup + DB schema**

Morning (1hr):
- Create GitHub repo: `medai-platform`
- Initialize Next.js 14 with TypeScript: `npx create-next-app@latest medai-platform --typescript --tailwind --app`
- Install shadcn/ui: `npx shadcn-ui@latest init`
- Install dependencies: `npm install @prisma/client prisma next-auth @auth/prisma-adapter react-query`

Evening + afternoon sprint (3hrs):
- Set up Supabase project (new project in supabase.com dashboard)
- Write `schema.prisma` — define all 5 tables: `users`, `predictions`, `reports`, `consultations`, `messages`
- Critical: `users` table must have `role` field (enum: user/doctor/admin) and `subscription` field (enum: free/premium) from day one
- Run `npx prisma db push` — confirm all tables created in Supabase
- Push to GitHub

**Verify:** Can you explain why `consultations.id` also serves as the Socket.io room ID?

---

### Day 2 — Jul 13 (Monday) · 2.5 hrs
**Theme: NextAuth + role-based auth**

Morning (1hr):
- Read NextAuth v5 docs: https://authjs.dev/getting-started

Evening (1.5hrs):
- Install: `npm install next-auth@beta @auth/prisma-adapter bcryptjs`
- Configure `auth.ts` with Google OAuth provider + credentials provider
- Add `.env.local`: `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DATABASE_URL`
- Create Google OAuth app in Google Console, whitelist `localhost:3000`
- Test: login with Google → confirm user row created in Supabase with role = "user"

**Verify:** What is an HTTP-only cookie and why does NextAuth use it instead of localStorage?

---

### Day 3 — Jul 14 (Tuesday) · 2.5 hrs
**Theme: Middleware + UI shell**

Morning (1hr):
- Plan sidebar navigation structure on paper: which routes exist, which roles can access them

Evening (1.5hrs):
- Write `middleware.ts` — protect routes by role:
  - `/dashboard/*` → role: user
  - `/doctor/*` → role: doctor
  - `/admin/*` → role: admin
  - Redirect unauthorized users to `/unauthorized`
- Build persistent sidebar layout component (`app/dashboard/layout.tsx`)
- Build top navbar with user avatar + role badge
- Add dark mode toggle (Tailwind dark class strategy)

**Verify:** Where does middleware run — on the server or the client? Why does that matter for auth?

---

### Day 4 — Jul 15 (Wednesday) · 2.5 hrs
**Theme: FastAPI boilerplate + dataset**

Morning (1hr):
- Download Kaggle symptom-disease dataset: "Disease Prediction Using ML" (Training.csv, Testing.csv)
- Download NIH Chest X-ray dataset subset (Normal vs Pneumonia, ~2000 images each)
- Quick EDA in Jupyter: check shape, class distribution, null values, symptom column names

Evening (1.5hrs):
- Create `/fastapi` folder in repo root
- Set up Python venv: `python -m venv venv && source venv/bin/activate`
- Install: `pip install fastapi uvicorn pydantic python-multipart scikit-learn pandas numpy pillow torch torchvision nltk`
- Create `main.py` with:
  - FastAPI app instance
  - CORS middleware (allow only `http://localhost:3000`)
  - `GET /health` → returns `{"status": "ok"}`
- Run: `uvicorn main:app --reload` → test `/health` in browser
- Add shared secret: `FASTAPI_SECRET` in `.env` — Next.js will send this header, FastAPI will check it

**Verify:** Why do we proxy ML calls through Next.js API routes instead of calling FastAPI directly from the browser?

---

## Week 2 — ML Core (Jul 18–24)
**Goal:** Disease prediction model live. Chatbot trained and responding. Both connected to the frontend.

*(Jul 16–17 Value Labs placement — no project work)*

---

### Day 5 — Jul 18 (Saturday) · 4 hrs
**Theme: Disease prediction model**

- Load Training.csv with pandas
- Separate features (132 symptom columns) from label (`prognosis`)
- LabelEncoder on prognosis → save encoder as `label_encoder.pkl`
- Build symptom-to-index mapping dict → save as `symptom_mapping.json`
- Train/test split: 80/20, `stratify=y`
- Train `RandomForestClassifier(n_estimators=100, random_state=42)`
- Evaluate: print `classification_report()` — target overall accuracy > 95%
- Save model: `pickle.dump(model, open("disease_model.pkl", "wb"))`
- Also try `XGBClassifier` — compare F1-scores, keep whichever wins

**Verify:** What is stratified splitting and what goes wrong without it on this dataset?

---

### Day 6 — Jul 19 (Sunday) · 4 hrs
**Theme: /predict endpoint + symptom checker UI**

Morning (2hrs — FastAPI):
- Load `disease_model.pkl` and `label_encoder.pkl` at FastAPI startup (use `@app.on_event("startup")`)
- Load `symptom_mapping.json`
- Write `POST /predict`:
  - Receive `{"symptoms": ["headache", "fever", "cough"]}`
  - Convert to 132-length binary vector using mapping
  - `model.predict_proba([vector])` → get top 3 diseases with confidence
  - If max confidence < 0.60 → add `"recommended_test": "blood_test"` to response
  - Return `{"results": [{disease, confidence}], "recommended_test": null|string}`
- Test with Postman

Afternoon (2hrs — Next.js):
- Create `app/api/predict/route.ts`:
  - Check user session (must be logged in)
  - Forward symptoms to FastAPI with `FASTAPI_SECRET` header
  - Save prediction result to Supabase `predictions` table
  - Return result to frontend
- Build `/dashboard/symptom-checker` page:
  - Multi-select dropdown of all 132 symptoms (searchable, grouped by category)
  - Submit button → calls `/api/predict`
  - Results card: top 3 diseases with confidence progress bars
  - Recommended test badge (if applicable)

**Verify:** Why do we save prediction results to the DB even though the model already gave the answer?

---

### Day 7 — Jul 20 (Monday) · 2.5 hrs
**Theme: Symptom checker polish + edge cases**

Morning (1hr):
- Add loading skeleton while prediction is running
- Add error state if FastAPI is down (graceful fallback message)

Evening (1.5hrs):
- Add symptom history page: fetch user's past predictions from Supabase, display as timeline
- Add "Consult a Doctor" CTA button that appears after each prediction result
- Test the full flow: select symptoms → predict → save → view in history

---

### Day 8 — Jul 21 (Tuesday) · 2.5 hrs
**Theme: Chatbot dataset**

Morning (1hr):
- Study the intents.json format (tag / patterns / responses structure)
- Plan 60 intent categories: symptoms (20), medicines (10), emergency (5), nearby help (5), general health (10), platform help (5), greetings/fallbacks (5)

Evening (1.5hrs):
- Write `intents.json` with 60+ intents (3-5 patterns each, 2-3 responses each)
- Critical intents to include: headache, fever, chest pain, diabetes, blood pressure, first aid, heart attack, stroke, nearby hospital, doctor booking, prescription query
- Add a fallback intent: patterns=[], response="I'm not sure I understand. Could you describe your symptoms differently?"

---

### Day 9 — Jul 22 (Wednesday) · 2.5 hrs
**Theme: Chatbot model + /chat endpoint**

Morning (1hr):
- Tokenize + stem all patterns using NLTK PorterStemmer
- Build vocabulary (all unique stems)
- Convert each pattern to bag-of-words vector

Evening (1.5hrs):
- Train MLP intent classifier (sklearn `MLPClassifier` or simple PyTorch net)
- Target training loss < 0.01
- Save model + vocabulary + label list
- Write `POST /chat` in FastAPI:
  - Receive `{"message": "I have a headache"}`
  - Preprocess → bag of words → predict intent → get confidence
  - If confidence < 0.75 → return fallback response
  - Return `{"intent": "headache", "response": "...", "confidence": 0.87}`
- Test with 10 different messages in Postman

**Verify:** Why is a 0.75 confidence threshold especially important for a health chatbot vs a general-purpose chatbot?

---

### Day 10 — Jul 23 (Thursday) · 2.5 hrs
**Theme: Chat UI on the frontend**

Evening (1.5hrs):
- Create `/dashboard/chat` page
- Build chat bubble UI: user messages right-aligned, bot messages left-aligned
- Connect to `POST /api/chat` → proxy to FastAPI → display response
- Add typing indicator (fake 800ms delay for UX)
- If confidence is low, show a "Try symptom checker instead" suggestion card

Morning (next day prep, 1hr):
- Write `POST /api/chat` route in Next.js (session check, FastAPI proxy, log message to DB if needed)

---

### Day 11 — Jul 24 (Friday) · 2.5 hrs
**Theme: Week 2 buffer + testing**

- End-to-end test: symptom checker → save → history
- End-to-end test: chatbot → 20 different messages → verify fallback works
- Fix any bugs or UI issues from the week
- Commit and push everything. Write brief comments on all FastAPI endpoints.

---

## Week 3 — Doctor Portal + CNN (Jul 25–31)
**Goal:** Real-time doctor chat live. Medical image upload pipeline working. CNN classifying X-rays.

---

### Day 12 — Jul 25 (Saturday) · 4 hrs
**Theme: Doctor dashboard + patient queue**

- Create `/doctor/dashboard` page (role-protected)
- Create `POST /api/consultations` Next.js route: creates consultation row, returns consultation_id
- Patient side: "Talk to a Doctor" button → creates consultation → enters waiting room UI
- Doctor side: see list of waiting patients with their latest symptom checker result + prediction
- Doctor clicks "Accept" → consultation status updates to "active"

---

### Day 13 — Jul 26 (Sunday) · 4 hrs
**Theme: Socket.io real-time chat**

- Install: `npm install socket.io socket.io-client`
- Create Socket.io server (can run alongside Next.js with a custom server, or deploy separately on Railway)
- Events to implement:
  - `join_room` — patient and doctor both join room by consultation_id
  - `send_message` — emit message to room
  - `receive_message` — listen and render in UI
  - `disconnect` — update consultation status if doctor leaves
- Save every message to `messages` table in Supabase (sender_id, content, timestamp, consultation_id)
- Test: open two browser tabs (patient + doctor), confirm real-time sync

**Verify:** What is a Socket.io "room" and why is it better than broadcasting to all connected clients?

---

### Day 14 — Jul 27 (Monday) · 2.5 hrs
**Theme: Prescription + PDF export**

Morning (1hr):
- Research `react-pdf` or `jsPDF` for client-side PDF generation

Evening (1.5hrs):
- Doctor types prescription in a textarea (markdown supported)
- "Send Prescription" button → saves to `consultations.prescription` column → updates status to "completed"
- Patient sees prescription in their consultation history
- "Download PDF" button → generates PDF from prescription text with patient name, date, doctor name
- Mark consultation as complete → remove from doctor's queue

---

### Day 15 — Jul 28 (Tuesday) · 2.5 hrs
**Theme: Report upload UI + Supabase Storage**

Morning (1hr):
- Read Supabase Storage docs: bucket setup, signed URLs, RLS policies

Evening (1.5hrs):
- Create Supabase Storage bucket: `medical-reports` (private, not public)
- Build file upload component: drag-and-drop zone, accepts image/* and .pdf
- `POST /api/upload-report` Next.js route:
  - Upload file to Supabase Storage
  - Create `reports` row with status = "pending_analysis"
  - Return the report id + signed URL
- Show upload progress bar and success confirmation

---

### Day 16 — Jul 29 (Wednesday) · 2.5 hrs
**Theme: CNN model training (Jupyter)**

- All work in Jupyter today — no frontend
- Load NIH Chest X-ray dataset (Normal vs Pneumonia subset)
- Build PyTorch dataset class with transforms: Resize(224,224) → ToTensor() → Normalize(ImageNet values)
- Load MobileNetV2: `torchvision.models.mobilenet_v2(pretrained=True)`
- Freeze all layers: `for param in model.parameters(): param.requires_grad = False`
- Replace final classifier: `model.classifier[-1] = nn.Linear(1280, 2)`
- Phase 1 training: train only final layer, 5 epochs, LR=1e-3
- Phase 2: unfreeze last 2 MobileNet InvertedResidual blocks, fine-tune 5 epochs, LR=1e-5
- Evaluate: print accuracy, F1-score per class. Target > 85% on test set.
- Save: `torch.save(model.state_dict(), "xray_model.pth")`

**Verify:** What is "catastrophic forgetting" and how does the two-phase training approach prevent it?

---

### Day 17 — Jul 30 (Thursday) · 2.5 hrs
**Theme: FastAPI /analyze endpoint**

Morning (1hr):
- Load `xray_model.pth` at FastAPI startup alongside the disease model
- Write image preprocessing function (PIL → resize → normalize → tensor)

Evening (1.5hrs):
- Write `POST /analyze`:
  - Receive `{"image_url": "signed_supabase_url"}`
  - Download image with `requests.get(image_url)`
  - Preprocess → model inference with `torch.no_grad()`
  - Return `{"label": "Pneumonia", "confidence": 0.91, "flagged": true}`
- Update `/api/upload-report` to call FastAPI `/analyze` after upload
- Update `reports` row in DB with CNN result and status = "analyzed"
- Test end-to-end: upload X-ray → CNN result appears in DB

---

### Day 18 — Jul 31 (Friday) · 2.5 hrs
**Theme: Doctor report review UI**

- Doctor dashboard: "Flagged Reports" tab showing all reports with status = "analyzed"
- Each report card shows: patient name, CNN label, confidence score, upload date, view image button
- Doctor clicks report → sees image + CNN result → types review notes → clicks "Mark as Reviewed"
- Updates report status to "reviewed" and saves `doctor_notes`
- Patient sees updated report status in their profile

---

## Week 4 — Places API + Admin + Deploy (Aug 1–7)
**Goal:** All 8 modules complete. Deployed. README done. Resume updated.

---

### Day 19 — Aug 1 (Saturday) · 4 hrs
**Theme: Nearby doctor/hospital finder**

- Enable Google Places API in Google Cloud Console. Get API key → add to `.env.local` as `GOOGLE_PLACES_API_KEY`
- Write `GET /api/nearby` Next.js route:
  - Receives `?lat=&lng=&type=hospital` from frontend
  - Calls Google Places Nearby Search API server-side (key hidden from client)
  - Returns: `[{name, address, rating, open_now, distance, place_id}]`
- Build `/dashboard/nearby` page:
  - Button: "Use my location" → `navigator.geolocation.getCurrentPosition()`
  - Type filter: Hospital / Clinic / Pharmacy
  - Results list with name, rating stars, open/closed badge, distance
  - Embed Google Maps iframe centered on user location

---

### Day 20 — Aug 2 (Sunday) · 4 hrs
**Theme: Admin panel**

- Create `/admin` layout (role = "admin" only)
- Section 1 — Chatbot intent manager:
  - Fetch current intents from `intents.json` via FastAPI `GET /intents`
  - Add new intent form: tag + patterns (comma-separated) + responses
  - Edit / delete existing intents
  - "Retrain Model" button → calls `POST /api/admin/retrain` → proxies to FastAPI `/retrain`
  - Show last retrained timestamp
- Section 2 — User management:
  - Table of all users with role, subscription tier, join date
  - Change role button (promote to doctor / demote to user)
- Section 3 — Doctor management:
  - Approve pending doctor accounts (doctors register with role="doctor_pending", admin activates)

---

### Day 21 — Aug 3 (Monday) · 2.5 hrs
**Theme: /retrain endpoint + subscription tiers**

Morning (1hr):
- Write FastAPI `POST /retrain`:
  - Check `Authorization: Bearer FASTAPI_SECRET` header — reject if missing
  - Re-read `intents.json`
  - Retrain chatbot model
  - Save new model pickle
  - Return `{"status": "ok", "accuracy": 0.96, "retrained_at": "..."}`

Evening (1.5hrs):
- Add subscription tier UI to user dashboard settings page
- Free tier: shows "Upgrade to Premium" card with feature list
- Mock "Pay ₹299/month" button → updates `users.subscription` to "premium" in DB (no real payment)
- Add middleware check: if user tries to access doctor consultation with `subscription = "free"`, redirect to upgrade page

---

### Day 22 — Aug 4 (Tuesday) · 2.5 hrs
**Theme: Deploy — Vercel + Railway**

Morning (1hr):
- Add all env variables to Vercel dashboard: `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DATABASE_URL`, `GOOGLE_PLACES_API_KEY`, `FASTAPI_URL`, `FASTAPI_SECRET`
- Deploy frontend to Vercel: `vercel deploy`
- Update Google OAuth whitelist with Vercel production URL

Evening (1.5hrs):
- Create `requirements.txt` for FastAPI: `pip freeze > requirements.txt`
- Create `Procfile` for Railway: `web: uvicorn main:app --host 0.0.0.0 --port $PORT`
- Deploy FastAPI to Railway: connect GitHub repo, set env variables, deploy
- Update CORS in FastAPI to allow Vercel domain
- Test health check: `GET https://your-railway-url/health`

---

### Day 23 — Aug 5 (Wednesday) · 2.5 hrs
**Theme: End-to-end testing on production**

- Test all 5 critical flows on the live Vercel URL:
  1. Register → login → view dashboard
  2. Select symptoms → predict → view history
  3. Chat with bot → get response → fallback for unknown input
  4. Upload X-ray → wait for CNN → see result
  5. Find nearby hospitals using real location
- Fix CORS errors, broken env vars, missing migrations
- Push all fixes to main branch → auto-deploy via Vercel

---

### Day 24 — Aug 6 (Thursday) · 2.5 hrs
**Theme: README + Architecture diagram**

- Write `README.md`:
  - Project overview (2 paragraphs)
  - Architecture diagram (simple ASCII or Mermaid)
  - Tech stack table
  - Feature list with screenshots (Loom GIF or static screenshots)
  - Local setup instructions: clone → env vars → prisma push → npm run dev + uvicorn
  - Live demo link (Vercel URL)
- Record a 90-second Loom demo walkthrough (symptom checker + chatbot + report upload + nearby finder)

---

### Day 25 — Aug 7 (Friday) · 2 hrs
**Theme: Resume + interview prep**

- Update resume: add MedAI under Projects section
  - "Built a full-stack AI healthcare platform with Next.js 14, FastAPI, and PyTorch. Implemented 3 ML tracks: Random Forest disease prediction (95%+ accuracy, 42 diseases, 132 symptoms), NLTK intent chatbot, and MobileNetV2 CNN for chest X-ray classification. Features real-time doctor consultation via Socket.io, medical report analysis, and Google Places API integration. Deployed on Vercel + Railway."
- Write 2 STAR interview stories about this project:
  - Story 1: Technical challenge (CNN class imbalance — how you detected it, what you did)
  - Story 2: Architecture decision (why two backends, what would've broken with one)

---

## MVP priority order (if time runs short)

| Priority | Module | Why |
|---|---|---|
| Must have | Auth + symptom checker + chatbot | Core ML demo — non-negotiable |
| Must have | Doctor portal + real-time chat | Shows full-stack + real-time skills |
| Must have | Report upload (even without CNN) | Pipeline is impressive even before CNN |
| Good to have | CNN analysis | Most complex ML piece — attempt if on schedule |
| Good to have | Nearby finder | Quickest to build (1 day) — good ROI |
| Nice to have | Admin panel | Useful for demo, not for interview stories |
| Bonus | Subscription/payment | 2hr task — do it last if time allows |

---

## Key architecture reminders

- Next.js API routes = auth, DB, Google Places, file uploads
- FastAPI = all ML inference, model serving, retraining
- Never call FastAPI directly from the browser
- Always send `FASTAPI_SECRET` header from Next.js to FastAPI
- CORS: FastAPI allows only `localhost:3000` and Vercel production URL
- Prisma for all DB queries — never raw SQL except in Supabase dashboard for debugging
- `model.eval()` + `torch.no_grad()` always at CNN inference time
- Use ImageNet normalization values for MobileNetV2: mean=[0.485,0.456,0.406], std=[0.229,0.224,0.225]
- Chatbot confidence threshold: 0.75. Below it → return fallback. Never guess on health info.
- `consultations.id` = Socket.io room ID (deliberate design — no separate room table needed)
