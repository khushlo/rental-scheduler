# Database Seeding

This project includes database seeding functionality to quickly populate your database with sample products and customers.

## Available Scripts

### `npm run db:seed`
Seeds the database with sample data from JSON files (only if tables are empty):
- Loads products from `prisma/data/products.json`
- Loads customers from `prisma/data/customers.json`
- Skips seeding if data already exists

### `npm run db:reseed`
Force reseeds the database:
- Clears existing products and customers
- Preserves bookings (business data)
- Recreates products and customers from JSON files

### `npm run db:reset`
Complete database reset and seed:
- Resets the entire database schema
- Seeds with fresh data
- **⚠️ WARNING: This deletes ALL data including bookings**

## Sample Data Files

### Products (`prisma/data/products.json`)
Contains 12 sample rental products including:
- Camping equipment (tents, sleeping bags, chairs)
- Outdoor gear (backpacks, hiking boots, GPS)
- Accessories (water bottles, first aid kits, ropes)

### Customers (`prisma/data/customers.json`)
Contains 10 sample customers with:
- Contact information (name, phone, address)
- Optional notes about customer preferences

## Customizing Data

To customize the sample data:

1. **Edit JSON files**:
   - `prisma/data/products.json` - Add/modify products
   - `prisma/data/customers.json` - Add/modify customers

2. **Run seeding**:
   ```bash
   npm run db:reseed  # Force reload with new data
   ```

## JSON File Format

### Products
```json
{
  "name": "Product Name",
  "quantity": 10,
  "rentPrice": 25.00,
  "status": true
}
```

### Customers
```json
{
  "name": "Customer Name",
  "phone1": "+1-555-0101",      // Required
  "phone2": "+1-555-0102",      // Optional
  "address": "Full Address",    // Optional
  "notes": "Customer notes"     // Optional
}
```

## Quick Start After Database Reset

If you've reset your database and need to get back up and running quickly:

```bash
# Reset database and seed with sample data
npm run db:reset

# Or just seed if database is empty
npm run db:seed
```

This will give you a working rental scheduler with sample products and customers to test with.