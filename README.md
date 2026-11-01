# dexattendance

Attendance management app with a Next.js frontend and NestJS backend.

## Requirements

- Node.js 20+
- npm
- MySQL or MariaDB
- Cloudinary account (needed for attendance photo uploads)

## Setup

Install dependencies:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Create `backend/.env`:

```env
PORT=3001
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="replace-with-a-long-random-secret"
```

Create `frontend/.env`:

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="your-upload-preset"
```

Do not commit either `.env` file.

Initialize the database:

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

## Run locally

Start the backend in one terminal:

```bash
cd backend
npm run start:dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The API runs on
[http://localhost:3001](http://localhost:3001).

The first registered account becomes the administrator. New accounts remain
inactive until an administrator activates them.
