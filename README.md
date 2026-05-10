# 🧠 Brain Tumour Classification with Explainable AI

> An end-to-end deep learning system for MRI-based brain tumour classification with real-time explainability — deployed as a full-stack web application with role-based access for doctors and patients.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=flat-square&logo=vercel)](https://brain-tumor-frontend-three.vercel.app)
[![ML Backend](https://img.shields.io/badge/ML%20Backend-HuggingFace%20Spaces-yellow?style=flat-square&logo=huggingface)](https://huggingface.co/spaces/kshitijt15/brain-tumor-xai)
[![Model Weights](https://img.shields.io/badge/Model-HF%20Hub-orange?style=flat-square&logo=huggingface)](https://huggingface.co/kshitijt15/resnet101-brain-tumor)
[![Dataset](https://img.shields.io/badge/Dataset-Kaggle-20BEFF?style=flat-square&logo=kaggle)](https://www.kaggle.com/datasets/userisakid/augmented-figshare-dataset)
[![Training Notebook](https://img.shields.io/badge/Notebook-ResNet101%20Training-20BEFF?style=flat-square&logo=kaggle)](https://www.kaggle.com/code/userisakid/resnet101-v1)
[![XAI Notebook](https://img.shields.io/badge/Notebook-XAI%20Implementation-20BEFF?style=flat-square&logo=kaggle)](https://www.kaggle.com/code/userisakid/resnet101-xai-combined-v1)

---

## 📌 Overview

This project classifies brain MRI scans into four categories — **Glioma**, **Meningioma**, **Pituitary**, and **No Tumour** — using a fine-tuned ResNet101 model trained on the augmented FigShare dataset. Three XAI techniques (Grad-CAM, SHAP, LIME) provide visual explanations of every prediction. A production-grade web application serves both doctors and patients with separate dashboards, authentication, and persistent scan history.

**Test accuracy: 99.3% across all 4 classes on the FigShare test set.**

---

## 🗂️ Project Components

| Component | Link |
|---|---|
| 🖥️ **Frontend** (this repo) | Next.js 14 · TypeScript · Tailwind · Supabase |
| 🤖 **ML Backend** | HuggingFace Spaces (FastAPI + ZeroGPU) |
| 🏋️ **Model Weights** (171 MB) | HuggingFace Model Hub |
| 📦 **Dataset** | [Augmented FigShare on Kaggle](https://www.kaggle.com/datasets/userisakid/augmented-figshare-dataset) |
| 📓 **ResNet101 Training Notebook** | [Kaggle](https://www.kaggle.com/code/userisakid/resnet101-v1) |
| 📓 **XAI Implementation Notebook** | [Kaggle](https://www.kaggle.com/code/userisakid/resnet101-xai-combined-v1) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│         Doctor Browser            Patient Browser           │
│    Upload · Cases · XAI      My Scans · Result · XAI        │
└──────────────────┬──────────────────────┬───────────────────┘
                   │                      │
┌──────────────────▼──────────────────────▼───────────────────┐
│               FRONTEND — Vercel (Next.js 14)                │
│   Auth (Supabase)  ·  Role Routing  ·  API Proxy Routes     │
│   /doctor/*  (upload, cases, cases/[id])                    │
│   /patient/* (upload, scans, result/[id])                   │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
┌──────────────▼──────────────┐  ┌────────▼───────────────────┐
│  SUPABASE (Auth + Database) │  │  HF SPACES — ZeroGPU A100  │
│  - Auth with role metadata  │  │  FastAPI + ResNet101       │
│  - profiles table (role)    │  │  /predict  → Grad-CAM      │
│  - scans table (results +   │  │  /shap     → SHAP          │
│    Storage URLs)            │  │  /lime     → LIME          │
│  - xai-images Storage bucket│  │  /health   → keep-alive    │
└─────────────────────────────┘  └────────────────────────────┘
```

---

## 🤖 ML Model

### Architecture
- **Base model:** ResNet101 (ImageNet-V1 pretrained)
- **Frozen layers:** `conv1`, `bn1`, `layer1`, `layer2`
- **Head:** Linear(2048 → 4) replacing original FC layer
- **Input:** 224×224 RGB MRI images, ImageNet normalisation

### Training Setup
- **Dataset:** Augmented FigShare — 4 classes (Glioma, Meningioma, No Tumour, Pituitary)
- **Optimiser:** AdamW with weight decay
- **Scheduler:** ReduceLROnPlateau (1e-4 → 5e-5 at epoch 7)
- **Epochs:** 13 with early stopping on best validation checkpoint

### Results

| Class | Accuracy |
|---|---|
| Glioma | 98.57% |
| Meningioma | 99.29% |
| No Tumour | 100.00% |
| Pituitary | 99.29% |
| **Overall** | **~99.3%** |

---

## 🔍 XAI Techniques

All three techniques run server-side on ZeroGPU (free A100) and return images stored in Supabase Storage.

| Technique | Method | Typical Latency | What it shows |
|---|---|---|---|
| **Grad-CAM** | Gradient × activation in `layer4[-1].conv3` | ~100ms | Which spatial regions the model focused on |
| **SHAP** | GradientExplainer with 40-image background set | ~3–4s | Pixel-level feature attribution (red = supports, blue = opposes) |
| **LIME** | 600 perturbation samples, quickshift segmentation | ~8–12s | Superpixel regions that most supported the decision |

---

## 🖥️ Web Application

### Features
- 🔐 Email/password authentication with role-based access (Doctor / Patient)
- 🩺 **Doctor dashboard:** upload MRI, enter patient name, watch XAI results stream in progressively, write clinical notes
- 👤 **Patient dashboard:** self-upload, view own scan history, XAI results, doctor notes, and AI explanation
- 🤖 **AI explanation:** plain-language summary of every scan result powered by Groq API (Llama 3.3 70B — free)
- 📸 XAI images stored as PNGs in Supabase Storage (not base64 in DB)
- 🔄 Concurrency-safe: abort controller prevents duplicate submissions; stale scans auto-cleaned on page load
- 📱 Responsive — works on mobile and desktop

### Pages

```
/                           Login / Sign-up
/doctor/upload              Upload MRI + run analysis (streaming XAI)
/doctor/cases               All completed cases (searchable + filterable)
/doctor/cases/[id]          Case detail: XAI images + doctor notes editor
/patient/upload             Patient self-upload
/patient/scans              Patient's scan history
/patient/result/[id]        Result detail: XAI + AI explanation + doctor notes
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS |
| **Auth + Database** | Supabase (Auth, PostgreSQL, Storage) |
| **ML Backend** | FastAPI, PyTorch, HuggingFace Spaces ZeroGPU |
| **Model** | ResNet101 (fine-tuned), torchvision |
| **XAI** | Grad-CAM (manual hooks), SHAP (GradientExplainer), LIME (lime_image) |
| **AI Explanation** | Groq API — Llama 3.3 70B (free tier) |
| **Frontend Hosting** | Vercel (free) |
| **ML Backend Hosting** | HuggingFace Spaces ZeroGPU (free A100) |
| **Model Storage** | HuggingFace Model Hub |

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- A Supabase project (free at [supabase.com](https://supabase.com))
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Steps

```bash
# 1. Clone
git clone https://github.com/KshitijT15/brain-tumor-classification-xai.git
cd brain-tumor-classification-xai

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Fill in the values (see below)

# 4. Run Supabase schema
# → Supabase dashboard → SQL Editor → paste and run supabase_schema.sql

# 5. Start dev server
npm run dev
# Opens at http://localhost:3000
```

## 🗄️ Database Schema

Run `supabase_schema.sql` in Supabase → SQL Editor:

```sql
-- Tables
profiles   (id, email, name, role, created_at)
scans      (id, patient_id, doctor_id, uploaded_by, patient_name,
            prediction, confidence, probabilities,
            gradcam_url, shap_url, lime_url,
            status, error_message, doctor_notes,
            ai_explanation, locked_at, created_at)

-- Storage bucket
xai-images  (public — PNG files at {scan_id}/{gradcam|shap|lime}.png)

-- Row Level Security
Doctors  → read / insert / update all scans
Patients → read only their own scans (patient_id = auth.uid())
```

---

## 📁 Project Structure

```
brain-tumor-classification-xai/
├── app/
│   ├── page.tsx                        ← Login / Sign-up
│   ├── layout.tsx
│   ├── globals.css
│   ├── doctor/
│   │   ├── upload/page.tsx             ← Upload MRI + streaming XAI
│   │   └── cases/
│   │       ├── page.tsx                ← All cases list
│   │       └── [id]/page.tsx           ← Case detail + notes editor
│   └── patient/
│       ├── upload/page.tsx             ← Patient self-upload
│       ├── scans/page.tsx              ← Scan history
│       └── result/[id]/page.tsx        ← Result + XAI + AI explanation
├── components/
│   └── xai/
│       ├── ResultCard.tsx              ← Prediction + probability bars
│       └── ExplanationCard.tsx         ← AI plain-language summary
├── lib/
│   ├── supabase.ts                     ← Supabase client + types
│   ├── auth.ts                         ← signUp, signIn, getCurrentUser
│   ├── scans.ts                        ← DB operations for scans table
│   ├── storage.ts                      ← Upload XAI PNGs to Supabase Storage
│   └── grok.ts                         ← Groq API for AI explanation
├── public/
├── .env.local.example
├── next.config.ts
└── package.json
```

---

## 🌐 Deployment

### Frontend → Vercel

```bash
npm i -g vercel
vercel login
vercel --prod
```

Add the four environment variables in Vercel → Project → Settings → Environment Variables, then redeploy.

### ML Backend → HuggingFace Spaces

The FastAPI backend with ZeroGPU runs on HuggingFace Spaces. To update `app.py`:

```bash
git clone https://huggingface.co/spaces/kshitijt15/brain-tumor-xai
# edit app.py
git add . && git commit -m "update" && git push
# Space auto-redeploys in ~2 minutes
```

### Model Weights → HuggingFace Hub

The `best_resnet101.pth` (171 MB) is hosted on HuggingFace Model Hub and downloaded automatically at backend startup. To upload updated weights:

```python
from huggingface_hub import HfApi
api = HfApi()
api.upload_file(
    path_or_fileobj="best_resnet101.pth",
    path_in_repo="best_resnet101.pth",
    repo_id="kshitijt15/resnet101-brain-tumor",
    repo_type="model",
    token="hf_..."
)
```

---

## ⚠️ Medical Disclaimer

This system is for **research and educational purposes only**. It is not a certified medical device and must not be used as a substitute for professional medical diagnosis. Always consult a qualified radiologist or neurologist.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
