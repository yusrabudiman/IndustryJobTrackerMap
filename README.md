# 🍔 Food-Industry Job Tracker Map

Track your food industry job applications on an interactive map. Visualize your F&B, FMCG, and food manufacturing career journey.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)

## Features

- 🗺️ **Interactive Map** — Click anywhere to place markers, zoom & drag
- 📊 **Status Tracking** — Applied, Interview, Offered, Joined, Rejected
- ⭐ **Multi-Rating System** — Rate salary, stability, and company culture (1–5)
- 🏷️ **Sub-Sector Tags** — FMCG, Retail F&B, Manufacturing, Startup, etc.
- 🔍 **Status Filters** — Toggle marker visibility by application status
- 🌙 **Dark Mode** — Beautiful dark theme with glassmorphism UI
- ☁️ **Cloud Native** — Vercel serverless + Prisma Accelerate + PostgreSQL

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 19 + Vite + TypeScript        |
| Styling   | Tailwind CSS v4                     |
| Map       | Leaflet.js + react-leaflet          |
| Backend   | Vercel Serverless Functions          |
| ORM       | Prisma Client + Accelerate          |
| Database  | PostgreSQL (via Prisma Data Platform)|
| Validation| Zod                                 |

## Project Structure

```
/food-industry-job-tracker
├── api/                    # Vercel serverless API routes
│   ├── companies.ts        # GET all / POST new company
│   └── companies/
│       └── [id].ts         # DELETE company by ID
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Database migrations
├── src/
│   ├── components/
│   │   ├── MapView.tsx     # Interactive Leaflet map with markers
│   │   ├── Sidebar.tsx     # Collapsible sidebar panel
│   │   ├── CompanyForm.tsx # Add company form with star ratings
│   │   ├── CompanyList.tsx # Tracked companies list
│   │   └── StatusFilter.tsx# Filter markers by status
│   ├── lib/
│   │   ├── api.ts          # Frontend API client
│   │   └── prisma.ts       # Prisma client singleton
│   ├── types/
│   │   └── company.ts      # TypeScript interfaces & enums
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles & theme
├── .env                    # Environment variables
├── vercel.json             # Vercel deployment config
├── vite.config.ts          # Vite configuration
└── package.json
```

## Local Development

### Prerequisites

- Node.js 18+
- npm or pnpm

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd food-industry-job-tracker
   npm install
   ```

2. **Configure environment:**
   Create `.env` file with your Prisma Accelerate connection string:
   ```env
   DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"
   ```

3. **Generate Prisma Client and run migration:**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

> **Note:** The Vite dev server proxies `/api` requests. For local API testing, you'll need to deploy to Vercel or use `vercel dev`.

## Deploy to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Set environment variables** in Vercel dashboard:
   - `DATABASE_URL` → Your Prisma Accelerate connection string

4. **Done!** The build command automatically runs `prisma generate` before building.

## API Reference

### `GET /api/companies`
Returns all companies ordered by `createdAt DESC`.

### `POST /api/companies`
Create a new company.

**Body:**
```json
{
  "name": "PT Mie Enak",
  "subSector": "Manufacturing",
  "latitude": -6.21,
  "longitude": 106.82,
  "status": "INTERVIEW",
  "ratingSalary": 4,
  "ratingStability": 3,
  "ratingCulture": 5,
  "notes": "HR friendly, lokasi jauh"
}
```

### `DELETE /api/companies/[id]`
Delete a company by ID.

## Marker Colors

| Status              | Color  |
|---------------------|--------|
| JOINED / OFFERED    | 🟢 Green |
| INTERVIEW           | 🟡 Yellow |
| APPLIED             | ⚪ Gray   |
| REJECTED            | 🔴 Red    |

## License

ISC
