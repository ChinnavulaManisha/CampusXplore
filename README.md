# CampusXplore

**Smart Campus Navigation and Facility Management System**  
*Lovely Professional University (LPU), Punjab, India*

CampusXplore is a modern web application engineered to streamline navigation across the Lovely Professional University campus and provide a centralized system for campus facility management.

---

## 1. Technology Stack

### Frontend
- **Framework / Bundler:** [React.js](https://react.dev/) with [Vite](https://vitejs.dev/) (JavaScript)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Routing:** [React Router DOM](https://reactrouter.com/)
- **API Client:** [Axios](https://axios-http.com/)
- **Icons:** [Lucide React](https://lucide.dev/)

### Backend
- **Core Runtime:** Python 3.14
- **Web Framework:** [Django 5.2 (LTS)](https://www.djangoproject.com/)
- **API Framework:** [Django REST Framework (DRF)](https://www.django-rest-framework.org/)
- **CORS Management:** `django-cors-headers`
- **Database Driver:** `psycopg[binary]` (v3)
- **Environment Management:** `python-dotenv`

### Database
- **Engine:** [PostgreSQL 18](https://www.postgresql.org/)
- **Database Name:** `campusxplore_db`

---

## 2. Project Directory Structure

```text
CampusXplore/
│
├── backend/
│   ├── config/
│   │   ├── __init__.py
│   │   ├── asgi.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── tests.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── venv/                      # Python virtual environment (ignored by Git)
│   ├── .env                       # Local secrets & credentials (ignored by Git)
│   ├── .env.example               # Template environment configuration
│   ├── .gitignore                 # Backend-specific ignore rules
│   ├── manage.py                  # Django CLI management utility
│   ├── requirements.txt           # Pinned Python package dependencies
│   └── setup_database.py          # Helper script to initialize database & run migrations
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   └── Navbar.jsx         # Reusable navigation bar with LPU branding
│   │   ├── hooks/                 # Custom React hooks directory
│   │   ├── layouts/               # Layout wrapper components directory
│   │   ├── pages/
│   │   │   └── LandingPage.jsx    # CampusXplore landing page
│   │   ├── services/
│   │   │   └── api.js             # Configured Axios client instance
│   │   ├── utils/                 # Utility helper functions directory
│   │   ├── App.jsx                # Router configuration & root component
│   │   ├── index.css              # Tailwind CSS entrypoint
│   │   └── main.jsx               # React DOM entrypoint
│   ├── .env                       # Local frontend environment variables
│   ├── .env.example               # Template frontend environment variables
│   ├── index.html                 # Main HTML template
│   ├── package.json               # Node.js dependencies and scripts
│   └── vite.config.js             # Vite configuration with Tailwind CSS plugin
│
├── .gitignore                     # Root Git ignore rules
└── README.md                      # Project documentation and setup guide
```

---

## 3. Environment Variable Configuration

Sensitive configuration and credentials are maintained exclusively in local `.env` files, which are strictly ignored by Git.

### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env` if not already present:

```env
# Django Configuration
DEBUG=True
SECRET_KEY=your_django_secret_key_here
ALLOWED_HOSTS=localhost,127.0.0.1

# PostgreSQL Database Configuration
DB_NAME=campusxplore_db
DB_USER=postgres
DB_PASSWORD=your_actual_postgres_password
DB_HOST=127.0.0.1
DB_PORT=5432

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Frontend (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

---

## 4. PostgreSQL Setup & Database Initialization

1. Verify that your PostgreSQL service is running on port `5432` (service `postgresql-x64-18` on Windows).
2. Open `backend/.env` and ensure `DB_PASSWORD` is set to your local PostgreSQL password.
3. Automatically create `campusxplore_db` and apply migrations by running:
   ```powershell
   cd backend
   .\venv\Scripts\python setup_database.py
   .\venv\Scripts\python manage.py migrate
   ```
   *Alternative manual creation via psql:*
   ```sql
   CREATE DATABASE campusxplore_db OWNER postgres;
   ```

---

## 5. Backend Setup Commands

From the project root:

```powershell
# 1. Navigate to backend
cd backend

# 2. Create Python virtual environment (if not already created)
python -m venv venv

# 3. Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Windows Command Prompt:
.\venv\Scripts\activate.bat
# Linux/macOS:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Run Django system check
python manage.py check

# 6. Run unit tests
python manage.py test

# 7. Start Django development server
python manage.py runserver 127.0.0.1:8000
```

---

## 6. Frontend Setup Commands

From the project root:

```powershell
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Build for production (optional verification)
npm run build
```

---

## 7. Verification & Health Check

### Health Check Endpoint
- **URL:** `GET http://127.0.0.1:8000/api/health/`
- **Response Format:**
  ```json
  {
    "status": "ok",
    "message": "CampusXplore backend is running"
  }
  ```

### Frontend Application
- **URL:** `http://localhost:5173`
- Displays the CampusXplore header with Lovely Professional University branding and dynamic API connection status.
