# 🍔 Food-Industry Job Tracker Map

Track your food industry job applications on an interactive map. Visualize your F&B, FMCG, and food manufacturing career journey.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)

## Features

- 🎨 **Premium Landing Page** — Elegant intro with parallax scrolling and section reveals
- 🔍 **Interactive Search** — Easily find companies and locations with auto-suggest search
- 🗺️ **Interactive Map** — Click anywhere to place markers, zoom & drag
- 🌓 **Dynamic Themes** — High-quality Light and Dark mode support
- 🔐 **User Authentication** — Secure Sign In and Sign Up with password hashing
- 👁️ **Privacy Controls** — Toggle entries between Public and Private visibility
- 📊 **Status Tracking** — Applied, Interview, Offered, Joined, Rejected
- ⭐ **Multi-Rating System** — Rate salary, stability, and company culture (1–5)
- 🏷️ **Sub-Sector Tags** — FMCG, Retail F&B, Manufacturing, Startup, etc.
- 🔍 **Status Filters** — Toggle marker visibility by application status
- 🌙 **Dark Mode** — Beautiful dark theme with glassmorphism UI
- ☁️ **Cloud Native** — Vercel serverless + Prisma Accelerate + PostgreSQL

## Tech Stack

| Layer     | Technology                           |
|-----------|--------------------------------------|
| Frontend  | React 19 + Vite + TypeScript         |
| Styling   | Tailwind CSS v4                      |
| Map       | Leaflet.js + react-leaflet           |
| Backend   | Vercel Serverless Functions          |
| Auth      | JWT (Jose) + Bcrypt.js               |
| ORM       | Prisma Client + Accelerate           |
| Database  | PostgreSQL (via Prisma Data Platform)|
| Validation| Zod                                  |

## Project Structure

```
/food-industry-job-tracker
├── api/                     # Vercel serverless API routes
│   ├── auth/                # Registration, Login, and Me endpoints
│   ├── companies.ts         # GET all / POST new company
│   └── companies/
│       └── [id].ts          # DELETE / PATCH (visibility) company
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Database migrations
├── src/
│   ├── components/
│   │   ├── LandingPage.tsx  # Premium intro page
│   │   ├── AuthPage.tsx     # Sign In / Sign Up UI
│   │   ├── LocationSearch.tsx # Search for companies & locations
│   │   ├── MapView.tsx      # Interactive Leaflet map
│   │   ├── Sidebar.tsx      # Collapsible sidebar panel
│   │   ├── CompanyForm.tsx  # Add company form with visibility toggle
│   │   ├── CompanyList.tsx  # Tracked companies with visibility badges
│   │   └── StatusFilter.tsx # Filter markers by status
│   ├── context/
│   │   └── AuthContext.tsx  # Global authentication state manager
│   ├── lib/
│   │   ├── api.ts           # Frontend API client (auth & companies)
│   │   ├── jwt.ts           # Server-side JWT utilities
│   │   └── prisma.ts        # Prisma client singleton
│   ├── types/
│   │   └── company.ts       # TypeScript interfaces (User & Company)
│   ├── App.tsx              # Main routing & state logic
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles & premium animations
├── .env                     # Environment variables
├── vercel.json              # Vercel deployment config
├── vite.config.ts           # Vite configuration
├── dev-server.ts            # Local API development server
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
   Create a `.env` file in the root directory. You need to provide your Prisma Data Platform account details for the database and a secret key for JWT:

   ```env
   # 1. DATABASE_URL
   # Get this from your Prisma Console (https://console.prisma.io)
   # Click on your project -> Environment Variables -> Accelerated URL
   DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_PRISMA_ACCELERATE_API_KEY"

   # 2. JWT_SECRET
   # Enter any strong random string here to sign your authentication tokens
   JWT_SECRET="your-super-long-random-secret-key-here"
   ```

3. **Generate Prisma Client and run migration:**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name add_auth
   ```

4. **Start the local API development server:**
   Because this project uses Vercel serverless functions, we use a custom dev server for local API testing:
   ```bash
   npx tsx dev-server.ts
   ```

5. **Start the Vite frontend:**
   Open another terminal and run:
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

## Deploy to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Set environment variables** in the Vercel dashboard:
   - `DATABASE_URL` → Your Prisma Accelerate Accelerated URL
   - `JWT_SECRET` → A strong random string for auth tokens

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
  "notes": "HR friendly, lokasi oke"
}
```

### `DELETE /api/companies/[id]`
Delete a company by ID.

## Marker Colors

| Status              | Color        |
|---------------------|--------------|
| JOINED / OFFERED    | 🟢 Green     |
| INTERVIEW           | 🟡 Yellow    |
| APPLIED             | ⚪ Gray      |
| REJECTED            | 🔴 Red       |

## License

ISC
