# WardFlow Architecture

## System Overview

WardFlow is an inpatient admission management web application designed for hospital administrative staff and nurses. It simplifies tracking admitted patients, editing admission details, filtering by clinical dimensions, discharging patients, and permanently deleting erroneous records.

```mermaid
graph TD
    User([Hospital Staff / Nurse]) -->|Interacts via Browser| Frontend[React + Vite Frontend\nSPA on Port 5173]
    Frontend -->|HTTP / JSON REST API| Backend[FastAPI Python Backend\nPort 8000]
    Backend -->|Pydantic V2| Validation[Validation & Business Rules\nDoctor-Dept Matching, Age, Dates]
    Backend -->|SQLAlchemy 2.x ORM| Database[(Persistent Database\nSQLite Local / PostgreSQL Neon)]
    
    subgraph Frontend Architecture
        App[App.jsx] --> Header[Header Component]
        App --> StatsCards[StatsCards Component]
        App --> FiltersBar[FiltersBar Component]
        App --> PatientTable[PatientTable & Mobile Cards]
        App --> PatientModal[PatientModal Form]
        App --> ConfirmModal[ConfirmModal Discharge / Delete]
        App --> Toast[Toast Notifications]
        App --> ApiService[services/api.js + AbortController]
    end

    subgraph Backend Architecture
        Main[app/main.py] --> CORSMiddleware[CORS Middleware]
        Main --> ExceptionHandler[Validation Exception Handler]
        Main --> Router[app/routers/patients.py]
        Router --> Schemas[app/schemas.py]
        Router --> Models[app/models.py]
        Router --> Constants[app/constants.py]
        Models --> DBEngine[app/database.py]
    end
```

## Architectural Highlights

### 1. Dual-Layer Validation
Validation is mirrored between React and FastAPI:
- **Client-side validation** gives instantaneous inline feedback to the user before network transmission.
- **Server-side validation** acts as the authoritative gatekeeper, verifying regex, data types, value boundaries, doctor-department mapping, and date sanity.

### 2. Search Race Condition Prevention
To prevent slow network responses from overwriting newer search results, the frontend utilizes `AbortController` in `services/api.js`. Each new keystroke in the debounced search aborts the in-flight request and dispatches a fresh request.

### 3. Dynamic Clinical Hierarchy
Doctor selections are dynamically filtered by the chosen Department on both the frontend and backend. Changing a department resets any previously chosen doctor that does not practice in that department.

### 4. Database Persistence
Records are committed to a persistent database engine (SQLite file locally, PostgreSQL on hosted cloud). The database schema includes Check Constraints (`age >= 0 AND age <= 120`, `status IN ('Admitted', 'Discharged')`) to guarantee relational integrity.
