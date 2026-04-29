# Healynx Backend

Smart Healthcare Platform for Doctor-Patient Connected Care. Built with FastAPI and Gemini AI.

## Features

- **Doctor-Patient Management**: Independent relationship scoping.
- **AI-Driven Treatment**: Gemini 2.0 Flash powered recommendations and explanations.
- **Recovery Tracking**: Daily symptom check-ins and recovery score algorithm.
- **Emergency SOS**: Immediate alert system for patients.
- **Medication Intelligence**: Tracking adherence and missed dose analysis.
- **Unified Medical Records**: Diagnoses, test results, and treatment plans.

## Tech Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy (Async)
- **AI**: Google Gemini 2.0 Flash
- **Auth**: JWT with Bcrypt
- **Validation**: Pydantic v2

## Getting Started

### 1. Setup Environment

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your keys:
```bash
cp .env.example .env
```

### 3. Run the Application

```bash
uvicorn app.main:app --reload
```

The API documentation will be available at `http://localhost:8000/docs`.
