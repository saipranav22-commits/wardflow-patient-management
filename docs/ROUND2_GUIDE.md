# Round 2 Interview Guide — WardFlow

This guide is prepared specifically for your **DScribe Software Engineer Intern Round 2 Interview**. It explains the entire application in clear, beginner-friendly terms, provides a file walkthrough, anticipates interviewer questions, and walks you through 8 hands-on live coding exercises.

---

## 1. High-Level Architecture in Plain English

```
[ User Browser (React) ]
         │  HTTP Requests (JSON)
         ▼
[ FastAPI Server (Python) ]
         │  Validates data using Pydantic
         ▼
[ SQLAlchemy ORM ]
         │  Executes Parameterized SQL Queries
         ▼
[ Persistent Database (SQLite local / PostgreSQL Neon production) ]
```

### How React communicates with FastAPI:
- The React frontend makes HTTP calls using `fetch()` encapsulated in `frontend/src/services/api.js`.
- In development, the React frontend runs on port `5173` and calls FastAPI on port `8000`.
- In production, React runs as a static site on Render and calls the deployed FastAPI service URL defined in `VITE_API_BASE_URL`.

### How CORS works:
- Because the browser prevents a website on port 5173 from making requests to port 8000 (Cross-Origin Resource Sharing), FastAPI includes `CORSMiddleware` in `backend/app/main.py`. This explicitly permits requests from the frontend origin with headers, credentials, and HTTP methods.

### How Data Survives Server Restart:
- Patient data is **never** kept only in memory or React state.
- Every create, edit, discharge, or delete operation commits directly to a persistent database file (`patients.db` locally, or PostgreSQL in production). When the server stops and restarts, the database file remains intact on disk, and records load immediately.

---

## 2. Key Files Walkthrough

| File | Purpose | What to explain |
|---|---|---|
| `backend/app/main.py` | API Entry point | Configures CORS, sets up global validation error handler, starts lifespan database initialization, and registers `/api/patients` and `/api/health`. |
| `backend/app/models.py` | Database Schema | Defines the `patients` table with SQLAlchemy. Contains database CHECK constraints (`age >= 0 AND age <= 120` and `status IN ('Admitted', 'Discharged')`). |
| `backend/app/schemas.py` | Data Validation | Pydantic V2 schemas. Enforces regex for names (letters only), age boundaries, dropdown verification, doctor-department consistency, and future date prevention. |
| `backend/app/constants.py` | Clinical Master Data | Lists approved Wards, Genders, Departments, Doctors, and Statuses. Provides `DEPARTMENT_DOCTORS` mapping. |
| `backend/app/routers/patients.py` | CRUD API Endpoints | Implements list (with AND filters and search), get by ID, create, update, discharge, and delete routes. |
| `frontend/src/App.jsx` | Main State Manager | Holds patient list, stats, filters, modal states, and toast notifications. Orchestrates API calls. |
| `frontend/src/services/api.js` | API Client | Centralizes network requests. Implements `AbortController` to cancel obsolete search requests. |
| `frontend/src/utils/validation.js` | Frontend Validation | Mirrors backend Pydantic validation to provide instant inline feedback before submitting. |
| `frontend/src/components/PatientTable.jsx` | Directory Table & Mobile Cards | Renders responsive table on desktop/tablet, and converts to thumb-friendly cards on mobile screens. |
| `frontend/src/components/PatientModal.jsx` | Admission / Edit Form | 8-field form with asterisks, field errors, and dynamic doctor dropdown filtered by department. |

---

## 3. Top Interview Questions & How to Answer

### Q1: "Why did you choose FastAPI over Flask or Django?"
> *"I selected FastAPI because it offers native asynchronous support, automatic interactive documentation (Swagger UI), and built-in type validation via Pydantic. Django would have introduced unnecessary complexity (admin, auth, ORM migrations) for an assessment that does not require login, while Flask would require manually installing and wiring multiple third-party libraries for validation and serialization. FastAPI gave the cleanest, most maintainable balance."*

### Q2: "How did you prevent search race conditions when typing quickly?"
> *"In `frontend/src/services/api.js`, I pass an `AbortSignal` from an `AbortController`. In `App.jsx`, each keystroke triggers a 250ms debounced function. If a user types another character before the previous network response completes, the controller aborts the previous request (`controller.abort()`). This ensures an older, slower search query never overwrites newer search results."*

### Q3: "How does doctor-department validation work?"
> *"It is validated on both frontend and backend. In the frontend (`PatientModal.jsx`), selecting a department immediately filters the doctor dropdown to show only doctors from that department. If the department is changed, any incompatible doctor is reset. On the backend (`backend/app/schemas.py`), a `@model_validator` checks the chosen doctor against `DEPARTMENT_DOCTORS[department]`. If someone sends a forged API request with a mismatch, the backend rejects it with HTTP 422."*

### Q4: "What is the difference between Discharging and Deleting a patient?"
> *"Discharging is a clinical status transition (`status = 'Discharged'`). The patient's entire record, admission date, and clinical history remain intact in the database for hospital documentation and compliance. Deletion (`DELETE /api/patients/{id}`) is a destructive administrative action that permanently removes an erroneous record from the database, requiring explicit confirmation to prevent accidental loss."*

---

## 4. Live Coding Exercises for Round 2

During Round 2, the interviewer may ask you to make a small live change. Here is how to do each common task:

### Exercise 1: Add a new Department (e.g. "Dermatology")
1. Open `backend/app/constants.py`:
   - Add `"Dermatology"` to `DEPARTMENTS = [...]`.
   - Add doctors in `DEPARTMENT_DOCTORS`:
     ```python
     "Dermatology": [
         "Dr. Anita Sen",
         "Dr. Deepak Kapoor",
     ],
     ```
2. The frontend automatically picks up new departments and doctors because it fetches `/api/options` dynamically!

### Exercise 2: Add a new Ward (e.g. "Emergency Ward")
1. Open `backend/app/constants.py`:
   - Add `"Emergency Ward"` to the `WARDS` list.
2. The frontend and backend validation immediately accept the new ward.

### Exercise 3: Change an age validation rule (e.g. Max Age to 100)
1. In `backend/app/schemas.py`:
   - In `validate_age()`, change `if value < 0 or value > 120:` to `100`.
   - Update error message: `"Age must be between 0 and 100 years inclusive."`
2. In `backend/app/models.py`:
   - Update CheckConstraint: `CheckConstraint("age >= 0 AND age <= 100", name="check_valid_age_range")`.
3. In `frontend/src/utils/validation.js`:
   - Update `if (numAge < 0 || numAge > 120)` to `100`.
4. In `frontend/src/components/PatientModal.jsx`:
   - Change `max="120"` to `max="100"`.

### Exercise 4: Add a new Patient Field (e.g. `blood_group`)
1. **Model** (`backend/app/models.py`):
   - Add column: `blood_group = Column(String(10), nullable=True)`.
2. **Schema** (`backend/app/schemas.py`):
   - Add to `PatientBase`: `blood_group: Optional[str] = Field(None)`.
3. **Router** (`backend/app/routers/patients.py`):
   - In `create_patient`, pass `blood_group=payload.blood_group`.
   - In `update_patient`, set `patient.blood_group = payload.blood_group`.
4. **Frontend Form** (`frontend/src/components/PatientModal.jsx`):
   - Add `<select>` for Blood Group (A+, B+, O+, AB+, etc.).

### Exercise 5: Change Sorting Order
1. Open `backend/app/routers/patients.py`.
2. In `list_patients()`, locate:
   ```python
   patients = query.order_by(Patient.admission_date.desc(), Patient.id.desc()).all()
   ```
3. To sort alphabetically by name:
   ```python
   patients = query.order_by(Patient.name.asc()).all()
   ```

### Exercise 6: Change a UI Button Label or Style
1. To change "Admit patient" to "New Admission":
   - In `frontend/src/components/Header.jsx`: change `<span>Admit patient</span>` to `<span>New Admission</span>`.
   - In `frontend/src/components/PatientModal.jsx`: update footer button text.
2. To change primary theme color:
   - In `frontend/src/styles/index.css`: change `--primary: #08796D;` to your desired color.
