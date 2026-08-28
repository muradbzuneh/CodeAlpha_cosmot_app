# Cosmot

A fullstack cosmetics e-commerce platform built with Express, React, and PostgreSQL.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Express 5, Prisma 6, PostgreSQL (Neon), TypeScript |
| Frontend | React 19, TanStack Router, Tailwind CSS 4, Vite 6 |
| Auth | JWT (access + refresh tokens), bcryptjs |
| Deployment | Railway (API) + Vercel (client) |

## Features

### Customer
- Browse products with category, gender, age, and price filtering
- Debounced full-text search
- Product detail pages with stock info
- Shopping cart with quantity control and promo codes (`COSMOT10`, `GLOW20`)
- Checkout with address, contact info, and payment method selection
- Order tracking with status progress visualization
- User profile with name/email update and password change

### Admin
- Dashboard with revenue, orders, products, and customer stats
- Product management (create, edit, delete, image upload)
- Order management with status updates and filtering
- Role-based access control (ADMIN / CUSTOMER)

### UI
- Responsive design (mobile-first)
- Animated preloader with brand splash
- Toast notifications
- Skeleton loading states
- Scroll-triggered fade-in animations
- Auto-advancing hero product slideshow with dot indicators

## Getting Started

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install

# Set up database
cd server
cp .env.example .env  # configure DATABASE_URL, JWT secrets
npx prisma db push
npx prisma db seed

# Run development
npm run dev  # server on :5000
cd ../client && npm run dev  # client on :5173
```

## Environment Variables

### Server (`server/.env`)
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `CORS_ORIGIN` | Allowed origins (comma-separated) |
| `PORT` | Server port (default: 5000) |

### Client (`client/.env.production`)
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API URL (e.g. `https://your-api.up.railway.app/api`) |

## Project Structure

```
cosmot/
├── server/
│   ├── src/
│   │   ├── controller/    # Route handlers
│   │   ├── lib/           # Prisma client, env config, response helper
│   │   ├── middleware/     # Auth + role middleware
│   │   └── routes/        # Express routers
│   ├── prisma/            # Schema + seed
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/    # Nav, footer, product card, toast, skeleton
│   │   ├── lib/           # API client, auth, cart, products provider
│   │   ├── routes/        # All pages (TanStack Router)
│   │   └── styles.css     # Tailwind + custom animations
│   └── package.json
└── README.md
```

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | Yes | Get current user |
| PUT | `/api/auth/profile` | Yes | Update profile |
| GET | `/api/products` | No | List products (filter, search, paginate) |
| GET | `/api/products/:id` | No | Get product |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |
| POST | `/api/orders` | Yes | Place order |
| GET | `/api/orders` | Yes | List orders |
| PATCH | `/api/orders/:id/status` | Admin | Update order status |
| GET | `/api/stats` | Admin | Dashboard stats |
| POST | `/api/upload` | Admin | Upload product image |

## License

Private
