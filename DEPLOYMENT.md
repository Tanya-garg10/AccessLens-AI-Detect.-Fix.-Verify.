# Deployment Guide

This guide covers various deployment options for AccessLens AI.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
  - [Vercel (Frontend) + Railway/Render (Backend)](#vercel--railwayrender)
  - [AWS](#aws)
  - [DigitalOcean](#digitalocean)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)

---

## Prerequisites

- Node.js 18+ and npm/pnpm
- Docker and Docker Compose (for containerized deployment)
- Git

---

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/Tanya-garg10/AccessLens-AI-Detect.-Fix.-Verify..git
cd Method-Lens-
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Set up database
npx prisma migrate dev --name init
npx prisma generate

# Start backend → http://localhost:4000
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with NEXT_PUBLIC_API_URL

# Start frontend → http://localhost:3000
npm run dev
```

---

## Docker Deployment

### Quick Start (Local)

```bash
# From project root
docker compose up
```

This will start both backend (port 4000) and frontend (port 3000).

### Production Docker Deployment

#### 1. Build and push images

```bash
# Build backend image
docker build -f backend/Dockerfile -t your-registry/accesslens-backend:latest .

# Build frontend image
docker build -f frontend/Dockerfile -t your-registry/accesslens-frontend:latest .

# Push to registry
docker push your-registry/accesslens-backend:latest
docker push your-registry/accesslens-frontend:latest
```

#### 2. Update docker-compose.yml for production

Replace local paths with registry images:

```yaml
services:
  backend:
    image: your-registry/accesslens-backend:latest
    # ... rest of config

  frontend:
    image: your-registry/accesslens-frontend:latest
    # ... rest of config
```

#### 3. Deploy with environment variables

```bash
docker compose up -d
```

---

## Cloud Deployment

### Vercel (Frontend) + Railway/Render (Backend)

#### Option 1: Vercel + Railway

**Frontend (Vercel):**

1. Connect your GitHub repository to Vercel
2. Set root directory to `frontend`
3. Configure environment variables:
   - `NEXT_PUBLIC_API_URL`: Your Railway backend URL
4. Deploy

**Backend (Railway):**

1. Connect your GitHub repository to Railway
2. Set root directory to `backend`
3. Configure environment variables (see [Environment Variables](#environment-variables))
4. Railway will automatically detect Node.js and deploy
5. Railway provides PostgreSQL - update `DATABASE_URL` accordingly

#### Option 2: Vercel + Render

Similar to Railway, but use Render for backend deployment.

---

### AWS

#### Using AWS ECS (Elastic Container Service)

**1. Build and push to ECR:**

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Create repositories
aws ecr create-repository --repository-name accesslens-backend
aws ecr create-repository --repository-name accesslens-frontend

# Build and tag
docker build -f backend/Dockerfile -t <account-id>.dkr.ecr.us-east-1.amazonaws.com/accesslens-backend:latest .
docker build -f frontend/Dockerfile -t <account-id>.dkr.ecr.us-east-1.amazonaws.com/accesslens-frontend:latest .

# Push
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/accesslens-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/accesslens-frontend:latest
```

**2. Set up ECS Cluster:**

```bash
aws ecs create-cluster --cluster-name accesslens
```

**3. Create task definitions and services**

Use AWS Console or CLI to create task definitions for both services, then deploy.

#### Using AWS Amplify

1. Connect your GitHub repository to Amplify
2. Amplify will auto-detect both frontend and backend
3. Configure build settings and environment variables
4. Deploy

---

### DigitalOcean

#### Using App Platform

1. Create a new app in DigitalOcean
2. Connect your GitHub repository
3. Add two components:
   - **Backend**: Root directory `backend`, build command `npm run build`, run command `npm start`
   - **Frontend**: Root directory `frontend`, build command `npm run build`, run command `npm start`
4. Configure environment variables for each component
5. Deploy

#### Using Droplet + Docker

```bash
# SSH into droplet
ssh root@your-droplet-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clone repository
git clone https://github.com/Tanya-garg10/AccessLens-AI-Detect.-Fix.-Verify..git
cd Method-Lens-

# Set environment variables
cp .env.example .env
nano .env  # Edit with your values

# Deploy
docker compose up -d
```

---

## Environment Variables

### Backend (.env)

```bash
PORT=4000
DATABASE_URL=postgresql://user:password@host:5432/database  # PostgreSQL for production
ALLOWED_ORIGIN=https://your-frontend-domain.com

# Optional - NVIDIA Nemotron (Nebius)
NEBIUS_API_KEY=your_nebius_api_key
NEBIUS_BASE_URL=https://api.studio.nebius.ai/v1
NEMOTRON_MODEL=nvidia/llama-3.1-nemotron-70b-instruct

# Optional - Tavily
TAVILY_API_KEY=your_tavily_api_key
```

### Frontend (.env.local or build environment)

```bash
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

---

## Database Setup

### SQLite (Development)

The default setup uses SQLite with `DATABASE_URL=file:./dev.db`. No additional setup needed.

### PostgreSQL (Production)

**1. Set up PostgreSQL database:**

```bash
# On Railway/Render/DigitalOcean, create a PostgreSQL instance
# Copy the connection string
```

**2. Update DATABASE_URL:**

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
```

**3. Run migrations:**

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

---

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use PostgreSQL instead of SQLite
- [ ] Configure CORS with your actual domain
- [ ] Set up SSL/HTTPS
- [ ] Configure environment variables for Nebius/Tavily (if using)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy for database
- [ ] Set up CI/CD pipeline
- [ ] Review security headers and rate limiting

---

## Troubleshooting

### Backend fails to start

- Check that DATABASE_URL is correct
- Ensure database migrations have run: `npx prisma migrate deploy`
- Check logs: `docker compose logs backend`

### Frontend can't connect to backend

- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS configuration in backend (`ALLOWED_ORIGIN`)
- Ensure backend is healthy: curl your-backend-url/health

### Database connection errors

- Verify DATABASE_URL format
- Check database is accessible from deployment environment
- Ensure database user has proper permissions

---

## Support

For issues or questions:
- Open an issue on GitHub
- Check existing documentation in README.md
