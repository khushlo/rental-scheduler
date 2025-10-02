import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Force reseeding database...');

  try {
    // Load JSON data
    const productsPath = join(__dirname, 'data', 'products.json');
    const customersPath = join(__dirname, 'data', 'customers.json');
    
    const productsData = JSON.parse(readFileSync(productsPath, 'utf8'));
    const customersData = JSON.parse(readFileSync(customersPath, 'utf8'));

    // Clear existing data (keep bookings to preserve business data)
    console.log('🗑️  Clearing existing products and customers...');
    await prisma.product.deleteMany({});
    await prisma.customer.deleteMany({});

    // Seed Products
    console.log('📦 Creating products...');
    const products = await prisma.product.createMany({
      data: productsData
    });
    console.log(`✅ Created ${products.count} products`);

    // Seed Customers
    console.log('👥 Creating customers...');
    const customers = await prisma.customer.createMany({
      data: customersData
    });
    console.log(`✅ Created ${customers.count} customers`);

    // Summary
    const totalProducts = await prisma.product.count();
    const totalCustomers = await prisma.customer.count();
    const totalBookings = await prisma.booking.count();
    
    console.log('\n🎉 Force reseeding completed!');
    console.log(`📊 Summary:`);
    console.log(`   • Products: ${totalProducts}`);
    console.log(`   • Customers: ${totalCustomers}`);
    console.log(`   • Bookings: ${totalBookings} (preserved)`);
    console.log('\n💡 Database is ready to use.');

  } catch (error) {
    console.error('❌ Error during reseeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });