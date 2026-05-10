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

## 📸 Screenshots

<table>
  <tr>
    <td align="center"><b>Login / Sign Up</b></td>
    <td align="center"><b>Doctor Upload</b></td>
  </tr>
  <tr>
    <td><img src="docs/login.png" width="480"/></td>
    <td><img src="docs/doctor-upload.png" width="480"/></td>
  </tr>
  <tr>
    <td align="center"><b>Analysis Result + Grad-CAM</b></td>
    <td align="center"><b>Case Detail — Grad-CAM · SHAP · LIME + AI Explanation</b></td>
  </tr>
  <tr>
    <td><img src="docs/doctor-result.png" width="480"/></td>
    <td><img src="docs/case-detail.png" width="480"/></td>
  </tr>
</table>

---

## 🗂️ Project Components

| Component | Link |
|---|---|
| 🖥️ **Frontend** (this repo) | Next.js 14 · TypeScript · Tailwind · Supabase |
| 🤖 **ML Backend** | HuggingFace Spaces (FastAPI + CPU Docker) |
| 🏋️ **Model Weights** (171 MB) | HuggingFace Model Hub |
| 📦 **Dataset** | [Augmented FigShare on Kaggle](https://www.kaggle.com/datasets/userisakid/augmented-figshare-dataset) |
| 📓 **ResNet101 Training Notebook** | [Kaggle](https://www.kaggle.com/code/userisakid/resnet101-v1) |
| 📓 **XAI Implementation Notebook** | [Kaggle](https://www.kaggle.com/code/userisakid/resnet101-xai-combined-v1) |

---

## 🏗️ Architecture

![Architecture](docs/full_deployment_architecture.svg)

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

All three techniques run server-side on CPU Docker and return images stored as PNGs in Supabase Storage.

| Technique | Method | Typical Latency (CPU) | What it shows |
|---|---|---|---|
| **Grad-CAM** | Gradient × activation in `layer4[-1].conv3` | ~3–5s | Which spatial regions the model focused on |
| **SHAP** | GradientExplainer with 16-image background set | ~30–40s | Pixel-level feature attribution (red = supports, blue = opposes) |
| **LIME** | 300 perturbation samples, quickshift segmentation | ~35–40s | Superpixel regions that most supported the decision |

---

## 🖥️ Web Application

### Features
- 🔐 Email/password authentication with role-based access (Doctor / Patient)
- 🩺 **Doctor dashboard:** upload MRI, enter patient name, watch XAI results stream in progressively, write clinical notes
- 👤 **Patient dashboard:** self-upload, view own scan history, XAI results, and doctor notes
- 📸 XAI images stored as PNGs in Supabase Storage (not base64 in DB)
- 📱 Responsive — works on mobile and desktop

### Pages

```
/                           Login / Sign-up
/doctor/upload              Upload MRI + run analysis (streaming XAI)
/doctor/cases               All completed cases (searchable + filterable)
/doctor/cases/[id]          Case detail: XAI images + doctor notes editor
/patient/upload             Patient self-upload
/patient/scans              Patient's scan history
/patient/result/[id]        Result detail: XAI + doctor notes
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS |
| **Auth + Database** | Supabase (Auth, PostgreSQL, Storage) |
| **ML Backend** | FastAPI, PyTorch, HuggingFace Spaces (CPU Docker) |
| **Model** | ResNet101 (fine-tuned), torchvision |
| **XAI** | Grad-CAM (manual hooks), SHAP (GradientExplainer), LIME (lime_image) |
| **Frontend Hosting** | Vercel (free) |
| **ML Backend Hosting** | HuggingFace Spaces CPU Basic (free) |
| **Model Storage** | HuggingFace Model Hub |

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- A Supabase project (free at [supabase.com](https://supabase.com))

### Steps

```bash
# 1. Clone
git clone https://github.com/KshitijT15/brain-tumor-classification-xai.git
cd brain-tumor-classification-xai

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Fill in your Supabase URL, anon key, and HF Space URL

# 4. Run Supabase schema
# → Supabase dashboard → SQL Editor → paste and run supabase_schema.sql

# 5. Start dev server
npm run dev
# Opens at http://localhost:3000
```

---

## 🗄️ Database Schema

Run `supabase_schema.sql` in Supabase → SQL Editor:

```sql
-- Tables
profiles   (id, email, name, role, created_at)
scans      (id, patient_id, doctor_id, uploaded_by, patient_name,
            prediction, confidence, probabilities,
            gradcam_url, shap_url, lime_url,
            status, error_message, doctor_notes, created_at)

-- Storage bucket
xai-images  (public — PNG files at {scan_id}/{gradcam|shap|lime}.png)

-- Row Level Security
Doctors  → read / insert / update their own scans (doctor_id = auth.uid())
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
│       └── result/[id]/page.tsx        ← Result + XAI + doctor notes
├── lib/
│   ├── supabase.ts                     ← Supabase client + types
│   ├── auth.ts                         ← signUp, signIn, getCurrentUser
│   ├── scans.ts                        ← DB operations for scans table
│   └── storage.ts                      ← Upload XAI PNGs to Supabase Storage
├── docs/
│   ├── login.png
│   ├── doctor-upload.png
│   ├── doctor-result.png
│   ├── case-detail.png
│   └── full_deployment_architecture.svg
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

Add environment variables in Vercel → Project → Settings → Environment Variables.

### ML Backend → HuggingFace Spaces

The FastAPI backend runs on HuggingFace Spaces CPU Docker. To update `app.py`:

```bash
git clone https://huggingface.co/spaces/kshitijt15/brain-tumor-xai
# edit app.py
git add . && git commit -m "update" && git push
# Space auto-redeploys in ~3 minutes
```

### Model Weights → HuggingFace Hub

The `best_resnet101.pth` (171 MB) is hosted on HuggingFace Model Hub and downloaded automatically at backend startup.

---

## ⚠️ Medical Disclaimer

This system is for **research and educational purposes only**. It is not a certified medical device and must not be used as a substitute for professional medical diagnosis. Always consult a qualified radiologist or neurologist.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
