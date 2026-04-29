# Healynx Backend - Development Plan (READPLAN)

This document outlines the current state and future roadmap for the Healynx backend.

## Phase 1: Foundation (Completed)
- [x] Define SQLAlchemy Async models (User, Doctor, Patient, SOS, etc.)
- [x] Setup FastAPI core with Pydantic schemas
- [x] Implement Gemini AI service wrapper
- [x] Create project structure and router orchestration

## Phase 2: Core API Implementation (In Progress)
- [ ] **Auth**: Implementation of login, registration, and role-based access control.
- [ ] **Doctors**: Profile management and patient association logic.
- [ ] **Patients**: Profile, vitals tracking, and symptom check-ins.
- [ ] **Diagnoses**: Logic for fetching AI recommendations based on symptoms/tests.
- [ ] **SOS**: Real-time alerting and resolution workflow.

## Phase 3: AI Intelligence Enhancement
- [ ] **Recovery Algorithm**: Finalize the formula for the daily recovery score (0-100).
- [ ] **Medication Logs**: Automated missed dose detection and alerting.
- [ ] **Diet Plans**: Dynamic generation based on patient allergies and condition.
- [ ] **Report Simplifier**: Patient-friendly translation for complex medical reports.

## Phase 4: Frontend Integration & Final Polish
- [ ] Connect with Next.js frontend.
- [ ] Implement WebSocket for real-time SOS alerts.
- [ ] Add unit tests for critical AI services.
- [ ] Deployment configuration (Docker/Neon).

## Technical Debt / Considerations
- Ensure HIPPA compliance for data storage.
- Optimize Gemini token usage for heavy check-ins.
- Implement caching for disease/test lookups.
