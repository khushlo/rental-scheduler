# Rental Scheduler

A modern rental scheduling application built with Next.js, TypeScript, and Prisma that helps you manage your rental business efficiently. Track inventory, manage customers, create bookings, and avoid scheduling conflicts.

## Features

### 🏠 Dashboard
- Overview of all rental operations
- Quick access to main features
- Clean, intuitive interface

### 📦 Product Management
- Add and manage rental products
- Set pricing per day
- Categorize products
- Track product availability

### 👥 Customer Management
- Store customer information
- Contact details and notes
- Rental history tracking

### 📅 Booking System
- Create rental bookings
- Automatic conflict detection
- Multiple booking statuses (Pending, Confirmed, Active, Completed, Cancelled)
- Total amount calculation

### 🔒 Conflict Prevention
- Real-time availability checking
- Prevents double-booking
- Clear error messages for conflicts

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Deployment Ready**: Vercel, Netlify, or any Node.js hosting

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Clone or download the project
2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

### Products
- Product information (name, description, category)
- Pricing per day
- Active/inactive status

### Customers  
- Contact information
- Address and notes
- Relationship to bookings

### Bookings
- Date range (start/end)
- Status tracking
- Total amount
- Relationships to products and customers

## API Endpoints

### Products
- `GET /api/products` - List all active products
- `POST /api/products` - Create new product

### Customers
- `GET /api/customers` - List all customers  
- `POST /api/customers` - Create new customer

### Bookings
- `GET /api/bookings` - List all bookings with relationships
- `POST /api/bookings` - Create new booking (with conflict checking)

## Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

## Development

### Adding New Features
1. Update the Prisma schema if needed (`prisma/schema.prisma`)
2. Run migrations: `npx prisma migrate dev --name feature_name`
3. Create API routes in `src/app/api/`
4. Add validation schemas in `src/lib/validations.ts`
5. Create UI components and pages

### Database Management
- View data: `npx prisma studio`
- Reset database: `npx prisma migrate reset`
- Deploy schema: `npx prisma migrate deploy`

## Deployment

### Vercel (Recommended)
### Vercel Deployment with PostgreSQL

1. **Set up PostgreSQL Database:**
   - **Option 1: Vercel Postgres** (Recommended)
     - Go to your Vercel project dashboard
     - Navigate to Storage → Create Database → Postgres
     - Copy the connection string
   
   - **Option 2: External Provider (Neon, Supabase, etc.)**
     - Create account with your preferred provider
     - Create a new PostgreSQL database
     - Get the connection string

2. **Configure Environment Variables in Vercel:**
   ```
   DATABASE_URL="postgresql://username:password@hostname:port/database"
   NEXTAUTH_SECRET="your-production-secret"
   NEXTAUTH_URL="https://your-app.vercel.app"
   ```

3. **Deploy Steps:**
   - Push to GitHub
   - Connect to Vercel
   - Vercel will automatically run `npx prisma generate` during build
   - Set environment variables in Vercel dashboard
   - Deploy automatically

4. **Run Migrations:**
   - After first deployment, run migrations in Vercel Functions or locally:
   ```bash
   # Using Vercel CLI
   vercel env pull .env.local
   npx prisma migrate deploy
   ```

### Manual Deployment
1. Build the project: `npm run build`
2. Set production DATABASE_URL
3. Run migrations: `npx prisma migrate deploy`
4. Start production server: `npm run start`

### Local Development with PostgreSQL
If you want to use PostgreSQL locally too:
1. Update your `.env` file with PostgreSQL URL
2. Run: `npm run db:migrate`
3. Run: `npm run db:seed` (optional)

## Future Enhancements

- [ ] Customer dashboard pages
- [ ] Product detail pages  
- [ ] Visual calendar component
- [ ] Email notifications
- [ ] Payment integration
- [ ] Advanced reporting
- [ ] Mobile app support
- [ ] Multi-tenant support

## License

MIT License - feel free to use this for your rental business!
