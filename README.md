# 🏫 CAMPUSXPLORE – SMART CAMPUS NAVIGATION & FACILITY MANAGEMENT SYSTEM 📍✨

Proud to share my latest project: **CampusXplore**, a modern full-stack web application engineered to revolutionize campus navigation and facility operations at **Lovely Professional University (LPU)**. Navigating an extensive university campus with dozens of academic blocks, departments, laboratories, hostels, food courts, and libraries can often be challenging for students, faculty, and new visitors. Moreover, reporting broken infrastructure or facility issues traditionally involves tedious paperwork and slow response times. 

**CampusXplore** solves this by providing interactive campus navigation, a centralized facility directory, role-based dashboards, and an automated issue reporting and tracking system — making campus exploration effortless and facility maintenance fast and transparent! 🎓🗺️🛠️

<!-- Place your screenshots below: replace image URLs with your uploaded GitHub assets or screenshots -->
## 🌟 Landing Page:
<img width="1891" height="865" alt="image" src="https://github.com/user-attachments/assets/84189a06-40d2-424b-8e98-83ac20f35d94" />


## 🔐 Login & Authentication:
<img width="1912" height="915" alt="image" src="https://github.com/user-attachments/assets/21257b76-286e-4284-a1cc-b2d32bda9eab" />





## 🗺️ Interactive Campus Map & Facilities:
<img width="1895" height="858" alt="image" src="https://github.com/user-attachments/assets/c5265037-2a06-4e78-aeea-d29e48ebaf16" />
<img width="1912" height="862" alt="image" src="https://github.com/user-attachments/assets/9c1175e0-782d-4e81-90e1-ccd2f3c11e38" />



## 📊 Role-Based Dashboards & Issue Reporting:
<img width="1891" height="856" alt="image" src="https://github.com/user-attachments/assets/9533d9a5-8a9a-45aa-9941-1494fcf295ca" />


---

## 🔑 KEY FEATURES:

🗺️ **Interactive Campus Map & Navigation** – Visual campus map powered by Leaflet to locate academic blocks, halls, and essential campus landmarks effortlessly.

🏢 **Comprehensive Facility Directory** – Detailed profiles for all campus facilities categorized by Academic, Sports, Food & Dining, Medical, Hostels, and Administration with timings, block locations, and contact info.

👥 **Role-Based Access Control (RBAC)** – Personalized user experiences and dashboards tailored for **Students**, **Faculty**, and **Campus Administrators**.

🛠️ **Campus Issue Reporting System** – Students and faculty can instantly submit infrastructure issues (faulty equipment, electrical/AC problems, plumbing, lab amenities) with category, severity level, location, and description.

🔔 **Real-Time Issue Status Tracking** – Transparent tracking of reported tickets from `Submitted` ➔ `In Progress` ➔ `Resolved` with administrative status notes.

📈 **Interactive Admin & Faculty Dashboards** – Centralized management interface for campus admins to review open maintenance requests, update ticket lifecycles, and monitor facility status.

🔐 **Secure JWT-Based Authentication** – Protected RESTful API endpoints and secure role verification using Django REST Framework SimpleJWT.

📱 **Modern, Responsive & Fast UI** – Clean, accessible UI designed with React 19 and Tailwind CSS v4, fully responsive across smartphones, tablets, and desktops.

---

## 👉 USER FLOW:

1. **Explore Campus**: Visitors and students can browse facilities or explore the interactive map directly from the Landing Page.
2. **Register & Log In**: Users authenticate securely with role-specific accounts (Student, Faculty, or Admin).
3. **Discover Facilities**: Search, filter by category (Libraries, Cafeterias, Labs, Hostels), and view exact locations, timings, and details.
4. **Report Infrastructure Issues**: Encounter a broken facility or maintenance problem? Submit a ticket with severity level, block location, and description.
5. **Real-Time Tracking & Resolution**: Students track progress live from their personal dashboard; administrators review tickets, update statuses, and coordinate fixes.

---

## 💻 TECH STACK:

🌐 **Frontend**: React 19, Vite, Tailwind CSS v4, React Router DOM, Leaflet, Lucide Icons, Axios

⚙️ **Backend**: Python 3.14, Django 5.2 (LTS), Django REST Framework (DRF), Gunicorn, WhiteNoise

💽 **Database**: PostgreSQL 18 (via `psycopg` v3)

🔐 **Authentication**: JWT (JSON Web Tokens) via `djangorestframework-simplejwt`

🔄 **State & Routing**: React Hooks, Protected Client-Side Routing

☁️ **Deployment**: Ready for Render (Backend & PostgreSQL) and Vercel (Frontend)

---

## 🚀 QUICK START & INSTALLATION:

### Prerequisites:
- Python 3.10+
- Node.js 18+ & npm
- PostgreSQL running locally on port `5432`

### 1. Backend Setup:
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate       # On Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
python setup_database.py       # Initializes DB & seeds initial categories
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

### 2. Frontend Setup:
```powershell
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to view the application!

---

💡 **Key Takeaways & Learning**:
This project provided deep hands-on experience in architecting full-stack web systems, implementing secure Role-Based Access Control (RBAC) with JWT, designing robust RESTful APIs with Django REST Framework, integrating relational databases with PostgreSQL, integrating interactive map libraries (Leaflet), and crafting modern, reactive user interfaces with React and Tailwind CSS for real-world institutional impact.
