# Trust-Based Campus Recovery Network

This repository contains the codebase for the **Trust-Based Campus Recovery Network**, a final year project that helps university students report lost and found items with trust-score-based verification.

The project is fully containerized using **Docker** and **Docker Compose**, running a local database instance to ensure offline capability and ease of development.

---

## Prerequisites

Before running the application, make sure you have the following installed on your machine:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (which includes Docker Compose)
- [Node.js](https://nodejs.org/) (optional, only needed if running services locally outside Docker)

---

## Getting Started (Recommended: Docker Compose)

The easiest way to run the entire stack (Frontend, Backend, and Database) is using Docker Compose. This automatically spins up a local **CockroachDB** database, initializes the tables, seeds the default admin user, and starts the development servers.

### 1. Start the services
From the root directory of the project, run:
```bash
docker compose up
```

*Note: Add the `--build` flag if you want to rebuild the container images (e.g., after modifying `package.json` dependencies):*
```bash
docker compose up --build
```

### 2. Access the Applications
Once the containers are started and healthy, you can access the following services in your browser:

* 💻 **Frontend Web Application**: [http://localhost:5173](http://localhost:5173)
* ⚙️ **Backend API Gateway**: [http://localhost:3000](http://localhost:3000)
* 📊 **CockroachDB Web Console**: [http://localhost:8080](http://localhost:8080)

---

## Seed Accounts & Login Credentials

On a fresh database initialization, the database is seeded automatically with a default Administrator account.

* **Admin Student ID / Username**: `Kyle`
* **Admin Password**: `Kyle16`

### Workflow for Testing
1. Log in as the Admin (`Kyle` / `Kyle16`).
2. Open a separate browser or incognito window, navigate to [http://localhost:5173](http://localhost:5173), and register a new student user (e.g., Student ID `STU001`).
3. Switch back to the Admin tab, navigate to the User Management dashboard, and **Verify** the newly registered student user.
4. Now, the new student user (`STU001`) can log in and report lost or found items!

---

## Directory Structure

* `/frontend`: React + Vite + TailwindCSS 4 application.
* `/backend`: NestJS application using Prisma ORM.
* `docker-compose.yml`: Docker Compose configuration orchestrating the frontend, backend, and db containers.

---

## Stopping the Containers

To stop the running Docker Compose stack, press `Ctrl + C` in the terminal where it is running, or run:
```bash
docker compose down
```

To stop the containers and **wipe the database volume** (e.g., to reset all data and re-run fresh seeds):
```bash
docker compose down -v
```
