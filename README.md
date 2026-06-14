# ⚖️ MİZAN AI — Türk Hukuku Yapay Zeka Asistanı

MİZAN AI is a production-ready Turkish legal AI assistant powered by **Retrieval-Augmented Generation (RAG)**. It helps legal professionals find relevant precedent cases (*emsal kararlar*) from Turkish courts and provides structured legal analysis — all grounded in real case data with zero hallucination.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-green.svg)
![React](https://img.shields.io/badge/react-18-blue.svg)

## 🏗️ Architecture

```
mizan-ai/
├── backend/          # Node.js + Express REST API
│   ├── src/
│   │   ├── config/       # Database & Passport configuration
│   │   ├── middleware/    # Auth, rate limiting, validation
│   │   ├── routes/       # API route handlers
│   │   └── services/     # RAG pipeline, embeddings, vector search
│   └── scripts/          # Data ingestion tools
└── frontend/         # React + Vite + TailwindCSS
    └── src/
        ├── components/   # Reusable UI components
        ├── contexts/     # React contexts (Auth)
        ├── pages/        # Page components
        └── api/          # Axios configuration
```

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL (Neon) with pgvector |
| **LLM** | Google Gemini 1.5 Flash |
| **Embeddings** | Gemini text-embedding-004 (768d) |
| **Auth** | Google OAuth 2.0 + JWT (httpOnly cookies) |
| **Frontend** | React 18, Vite, TailwindCSS v4 |
| **Vector Search** | pgvector with HNSW index |

## 🔧 Setup Instructions

### Prerequisites
- Node.js >= 18
- A [Neon](https://neon.tech) PostgreSQL database
- Google Cloud OAuth 2.0 credentials
- Google Gemini API key

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/mizan-ai.git
cd mizan-ai
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your actual credentials (see Environment Variables below)
npm install
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Ingest Sample Data

You can ingest the initial 10 hardcoded test cases via:
```bash
cd backend
npm run ingest
```

### 5. Veritabanına Gerçek Veri Yükleme (HuggingFace Ingestion)

To populate the database with real case law and regulations from the `newmindai` public HuggingFace datasets, run the dedicated ingestion script. This script fetches 100 case laws and 100 regulations, cleans the text, chunks them into ~600 word pieces, embeds them via Gemini `text-embedding-004`, and upserts them into your Neon vector database.

```bash
cd backend
npm run ingest:hf
```

**Expected Results:**
- **caselaw-retrieval**: ~100 records fetched, which may be chunked into more pieces.
- **regulation-retrieval**: ~100 records fetched, chunked similarly.
- You can expect to see progress logs (`Ingesting record X of Y...`) in the terminal.

**Verification in Neon Console:**
1. Open the [Neon Console](https://console.neon.tech).
2. Go to your project -> SQL Editor.
3. Run the following queries to verify the records:
   - `SELECT COUNT(*) FROM precedent_cases;` (Should reflect the newly added chunks)
   - `SELECT source, COUNT(*) FROM precedent_cases GROUP BY source;` (Should show `huggingface-caselaw` and `huggingface-regulation`)

## 🔑 Environment Variables

Create a `.env` file in the `backend/` directory:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3000` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `xxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `GOCSPX-xxxx` |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL | `http://localhost:3000/api/auth/google/callback` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSy...` |
| `GEMINI_LLM_MODEL` | Gemini LLM model | `gemini-1.5-flash` |
| `GEMINI_EMBEDDING_MODEL` | Gemini embedding model | `text-embedding-004` |
| `JWT_SECRET` | JWT signing secret | (random 64-char string) |
| `JWT_EXPIRES_IN` | JWT expiration | `7d` |
| `SESSION_SECRET` | Session secret | (random 64-char string) |

## 📡 API Documentation

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/google` | Initiate Google OAuth | No |
| `GET` | `/api/auth/google/callback` | OAuth callback | No |
| `POST` | `/api/auth/logout` | Logout (clear cookie) | No |
| `GET` | `/api/auth/me` | Get current user | Yes |

### Mizan AI (RAG)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/mizan/query` | Submit legal query for analysis | Yes |
| `GET` | `/api/mizan/history` | Get query history | Yes |

#### POST `/api/mizan/query`

**Request:**
```json
{
  "caseDescription": "İşçi, 5 yıllık kıdem süresinin ardından haksız yere işten çıkarılmıştır..."
}
```

**Response:**
```json
{
  "analysis": "[EMSAL KARAR BİLGİLERİ]...",
  "citedCase": {
    "id": "uuid",
    "case_number": "2023/1234",
    "court": "Yargıtay 9. Hukuk Dairesi",
    "decision_number": "2023/5678",
    "decision_date": "2023-06-15",
    "subject": "Haksız fesih"
  },
  "confidence": 0.87
}
```

### Health

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/health` | Health check | No |

## 🔒 Security Features

- **helmet.js** — Secure HTTP headers
- **Rate Limiting** — 100 req/15min global, 10 req/15min for AI endpoints
- **CORS** — Whitelist-only frontend URL
- **Input Validation** — express-validator on all inputs
- **JWT httpOnly Cookies** — Tokens never exposed to JavaScript
- **Parameterized Queries** — Zero SQL injection surface
- **Request Size Limit** — 10KB max body size

## 🧠 RAG Pipeline

1. **Embed** — User query is embedded using Gemini `text-embedding-004`
2. **Search** — pgvector cosine similarity search against precedent cases
3. **Threshold Check** — If no case exceeds 0.75 similarity, return a safe fallback message (no LLM call)
4. **Augment** — Build prompt with retrieved case context
5. **Generate** — Gemini 1.5 Flash produces structured analysis
6. **Cite** — Response always includes court, case number, decision number, and date

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss proposed changes.

---

**MİZAN AI © 2026** — *Adaletin ölçüsü, bilginin gücüdür.*
