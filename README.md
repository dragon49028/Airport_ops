# ✈️ AeroOps — Airport Ground Operations Management System

A full-stack production-ready web application for managing airport ground operations: flights, gates, runways, baggage, refueling, maintenance, and staff.

---

## 🏗️ Tech Stack

| Layer    | Technology |
|----------|-----------|
| Backend  | Spring Boot 3.2, Spring Data JPA, Spring Security (JWT) |
| Database | H2 (dev) / MySQL 8 (prod) |
| Frontend | React 18, Vite, TanStack Query, React Router v6, Tailwind CSS |
| Auth     | JWT with role-based access (ADMIN / STAFF / OPERATOR) |
| Docs     | SpringDoc OpenAPI (Swagger UI at `/swagger-ui.html`) |

---

## 🚀 Quick Start

### Option 1 — Dev Mode (fastest)

**Backend** (H2 in-memory, no MySQL needed):
```bash
cd backend
mvn spring-boot:run
# API runs on http://localhost:8080
# H2 Console: http://localhost:8080/h2-console (jdbc:h2:mem:airportdb)
# Swagger UI: http://localhost:8080/swagger-ui.html
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:3000
```

### Option 2 — Docker (full stack with MySQL)

```bash
docker-compose up --build
# Frontend: http://localhost:3000
# Backend:  http://localhost:8080
```

Note: Docker uses the `prod` profile and MySQL. Default demo users are not auto-seeded there; create an account from the Register tab first.

---

## 🔐 Demo Credentials

These are for dev mode (H2 profile), where sample data is initialized.

| Role     | Username   | Password   | Access |
|----------|------------|------------|--------|
| Admin    | admin      | admin123   | Full CRUD + Approve Maintenance |
| Staff    | staff1     | staff123   | Read + Write (no delete) |
| Operator | operator1  | operator123| Read Only |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login → returns JWT |
| POST | `/api/auth/register` | Register new user |
| GET/POST | `/api/aircraft` | List / Create aircraft |
| GET/PUT/DELETE | `/api/aircraft/{id}` | Manage aircraft |
| GET | `/api/aircraft/available` | Available aircraft only |
| GET/POST | `/api/flights` | Flights (supports `?search=`, `?active=true`) |
| GET/POST | `/api/gates` | Gate assignments |
| GET | `/api/gates/available?time=` | Available gates at a time |
| PATCH | `/api/gates/{id}/status` | Update gate status |
| GET/POST | `/api/runways` | Runway slots (conflict detection) |
| GET/POST | `/api/baggage` | Baggage manifests |
| PATCH | `/api/baggage/{id}/status` | Update baggage status |
| GET/POST | `/api/refuel` | Refuel requests |
| PATCH | `/api/refuel/{id}/status` | Update refuel status |
| GET/POST | `/api/maintenance` | Maintenance clearances |
| POST | `/api/maintenance/{id}/approve` | Approve clearance |
| GET/POST | `/api/staff` | Ground staff (supports `?search=`, `?available=true`) |
| GET | `/api/dashboard/stats` | Dashboard statistics |

---

## ⚡ Key Features

- **Real-time Dashboard** — Live stats, active flights, gate availability grid, critical alerts
- **Conflict Detection** — Gate and runway double-booking prevention at the service layer
- **Role-Based Access** — Admin sees all; Staff can write; Operators view only
- **Auto Aircraft Status** — Aircraft status auto-updates when flight status changes
- **Maintenance Workflow** — Report → Review → Approve (auto-restores aircraft availability)
- **Dark Theme UI** — Professional dark dashboard with Tailwind CSS
- **JWT Auth** — Secure stateless authentication with Bearer tokens
- **OpenAPI Docs** — Interactive Swagger UI at `/swagger-ui.html`

---

## 🗂️ Project Structure

```
airport-ops/
├── backend/
│   ├── src/main/java/com/airport/
│   │   ├── entity/          # JPA entities (8 entities)
│   │   ├── repository/      # Spring Data JPA repos
│   │   ├── service/         # Business logic + conflict detection
│   │   ├── controller/      # REST controllers
│   │   ├── security/        # JWT filter + utils
│   │   ├── config/          # Security + Jackson config
│   │   ├── dto/             # Request/Response DTOs
│   │   └── exception/       # Exception handling
│   └── src/main/resources/
│       ├── application.yml  # Dev (H2) + Prod (MySQL) profiles
│       ├── schema.sql       # Table definitions
│       └── data.sql         # Sample data (10 aircraft, 8 flights, etc.)
└── frontend/
    └── src/
        ├── pages/           # Dashboard, Flights, Aircraft, Gates, Runways,
        │                    # Baggage, Refuel, Maintenance, Staff
        ├── components/      # Layout, DataTable, Modal, StatCard, etc.
        ├── hooks/           # useAuth (context + JWT management)
        ├── services/        # Axios API client + per-resource helpers
        └── utils/           # Date formatting, status badge colors
```

---

## 🔧 MySQL Production Setup

```sql
CREATE DATABASE airport_ops CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'airport'@'%' IDENTIFIED BY 'airport123';
GRANT ALL PRIVILEGES ON airport_ops.* TO 'airport'@'%';
FLUSH PRIVILEGES;
```

Then run backend with:
```bash
SPRING_PROFILES_ACTIVE=prod \
MYSQL_HOST=localhost \
MYSQL_USER=airport \
MYSQL_PASSWORD=airport123 \
mvn spring-boot:run
```
