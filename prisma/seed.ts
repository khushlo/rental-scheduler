import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Load JSON data
    const productsPath = join(__dirname, 'data', 'products.json');
    const customersPath = join(__dirname, 'data', 'customers.json');
    
    const productsData = JSON.parse(readFileSync(productsPath, 'utf8'));
    const customersData = JSON.parse(readFileSync(customersPath, 'utf8'));

    // Check if data already exists
    const existingProducts = await prisma.product.count();
    const existingCustomers = await prisma.customer.count();

    // Seed Products
    if (existingProducts === 0) {
      console.log('📦 Seeding products...');
      const products = await prisma.product.createMany({
        data: productsData
      });
      console.log(`✅ Created ${products.count} products`);
    } else {
      console.log(`📦 Found ${existingProducts} existing products, skipping product seeding`);
    }

    // Seed Customers
    if (existingCustomers === 0) {
      console.log('👥 Seeding customers...');
      const customers = await prisma.customer.createMany({
        data: customersData
      });
      console.log(`✅ Created ${customers.count} customers`);
    } else {
      console.log(`👥 Found ${existingCustomers} existing customers, skipping customer seeding`);
    }

    // Summary
    const totalProducts = await prisma.product.count();
    const totalCustomers = await prisma.customer.count();
    
    console.log('\n🎉 Database seeding completed!');
    console.log(`📊 Summary:`);
    console.log(`   • Products: ${totalProducts}`);
    console.log(`   • Customers: ${totalCustomers}`);
    console.log('\n💡 You can now start using the rental scheduler app.');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
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