import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create sample products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Professional Camera Kit',
        quantity: 3,
        rentPrice: 75.00,
        status: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Laptop - MacBook Pro 16"',
        quantity: 5,
        rentPrice: 50.00,
        status: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Wedding Tent (20x40)',
        quantity: 2,
        rentPrice: 200.00,
        status: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Sound System',
        quantity: 4,
        rentPrice: 125.00,
        status: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Projector & Screen',
        quantity: 1,
        rentPrice: 85.00,
        status: false,
      },
    }),
  ]);

  // Create sample customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'John Smith',
        phone1: '(555) 123-4567',
        phone2: '(555) 123-4568',
        address: '123 Main St, Anytown, ST 12345',
        notes: 'Regular customer, prefers weekend rentals',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Sarah Johnson',
        phone1: '(555) 987-6543',
        phone2: '(555) 987-6544',
        address: '456 Oak Ave, Somewhere, ST 67890',
        notes: 'Event planner, often books multiple items',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Mike Wilson',
        phone1: '(555) 555-0123',
        address: '789 Pine Rd, Nowhere, ST 54321',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Emily Davis',
        phone1: '(555) 246-8135',
        phone2: '(555) 246-8136',
        address: '321 Elm St, Anyplace, ST 98765',
        notes: 'Photographer, frequently rents camera equipment',
      },
    }),
  ]);

  // Create sample bookings with multiple items
  const now = new Date();
  
  // Booking 1: Wedding photography with multiple items
  const booking1 = await prisma.booking.create({
    data: {
      startDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
      endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      startTime: '09:00',
      endTime: '18:00',
      totalAmount: 535.00,
      status: 'CONFIRMED',
      customerId: customers[3].id, // Emily Davis
      notes: 'Wedding photography shoot with full setup',
    },
  });

  // Add items to booking 1
  await Promise.all([
    prisma.bookingItem.create({
      data: {
        bookingId: booking1.id,
        productId: products[0].id, // Camera Kit
        quantity: 1,
        pricePerDay: 75.00,
        subtotal: 225.00, // 3 days * $75
        notes: 'Main camera setup',
      },
    }),
    prisma.bookingItem.create({
      data: {
        bookingId: booking1.id,
        productId: products[4].id, // Projector & Screen
        quantity: 1,
        pricePerDay: 85.00,
        subtotal: 255.00, // 3 days * $85
        notes: 'For slideshow presentation',
      },
    }),
    prisma.bookingItem.create({
      data: {
        bookingId: booking1.id,
        productId: products[3].id, // Sound System
        quantity: 1,
        pricePerDay: 125.00,
        subtotal: 375.00, // 3 days * $125
        notes: 'For ceremony music',
      },
    }),
  ]);

  // Booking 2: Corporate event setup
  const booking2 = await prisma.booking.create({
    data: {
      startDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      startTime: '08:00',
      endTime: '17:00',
      totalAmount: 370.00,
      status: 'CONFIRMED',
      customerId: customers[2].id, // Mike Wilson
      notes: 'Corporate presentation and video editing',
    },
  });

  // Add items to booking 2
  await Promise.all([
    prisma.bookingItem.create({
      data: {
        bookingId: booking2.id,
        productId: products[1].id, // MacBook Pro
        quantity: 2,
        pricePerDay: 50.00,
        subtotal: 200.00, // 2 days * $50 * 2 units
        notes: 'For video editing team',
      },
    }),
    prisma.bookingItem.create({
      data: {
        bookingId: booking2.id,
        productId: products[4].id, // Projector & Screen
        quantity: 1,
        pricePerDay: 85.00,
        subtotal: 170.00, // 2 days * $85
        notes: 'Main presentation screen',
      },
    }),
  ]);

  // Booking 3: Large outdoor event
  const booking3 = await prisma.booking.create({
    data: {
      startDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      endDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
      startTime: '10:00',
      endTime: '20:00',
      totalAmount: 1050.00,
      status: 'CONFIRMED',
      customerId: customers[1].id, // Sarah Johnson
      notes: 'Large corporate outdoor event with full setup',
    },
  });

  // Add items to booking 3
  await Promise.all([
    prisma.bookingItem.create({
      data: {
        bookingId: booking3.id,
        productId: products[2].id, // Wedding Tent
        quantity: 1,
        pricePerDay: 200.00,
        subtotal: 600.00, // 3 days * $200
        notes: 'Main event tent',
      },
    }),
    prisma.bookingItem.create({
      data: {
        bookingId: booking3.id,
        productId: products[3].id, // Sound System
        quantity: 1,
        pricePerDay: 125.00,
        subtotal: 375.00, // 3 days * $125
        notes: 'Event audio system',
      },
    }),
    prisma.bookingItem.create({
      data: {
        bookingId: booking3.id,
        productId: products[0].id, // Camera Kit
        quantity: 1,
        pricePerDay: 75.00,
        subtotal: 225.00, // 3 days * $75
        notes: 'Event photography',
      },
    }),
  ]);

  // Booking 4: Completed birthday party
  const booking4 = await prisma.booking.create({
    data: {
      startDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      endDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      totalAmount: 500.00,
      status: 'COMPLETED',
      customerId: customers[0].id, // John Smith
      notes: 'Birthday party celebration',
    },
  });

  // Add items to booking 4
  await Promise.all([
    prisma.bookingItem.create({
      data: {
        bookingId: booking4.id,
        productId: products[3].id, // Sound System
        quantity: 1,
        pricePerDay: 125.00,
        subtotal: 375.00, // 3 days * $125
        notes: 'Party music system',
      },
    }),
    prisma.bookingItem.create({
      data: {
        bookingId: booking4.id,
        productId: products[1].id, // MacBook Pro
        quantity: 1,
        pricePerDay: 50.00,
        subtotal: 150.00, // 3 days * $50
        notes: 'For DJ setup',
      },
    }),
  ]);

  // Booking 5: Active conference
  const booking5 = await prisma.booking.create({
    data: {
      startDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      endDate: new Date(now.getTime() + 17 * 24 * 60 * 60 * 1000), // 17 days from now
      totalAmount: 420.00,
      status: 'ACTIVE',
      customerId: customers[1].id, // Sarah Johnson
      notes: 'Tech conference presentation setup',
    },
  });

  // Add items to booking 5
  await Promise.all([
    prisma.bookingItem.create({
      data: {
        bookingId: booking5.id,
        productId: products[3].id, // Sound System
        quantity: 1,
        pricePerDay: 125.00,
        subtotal: 250.00, // 2 days * $125
        notes: 'Main conference audio',
      },
    }),
    prisma.bookingItem.create({
      data: {
        bookingId: booking5.id,
        productId: products[4].id, // Projector & Screen
        quantity: 1,
        pricePerDay: 85.00,
        subtotal: 170.00, // 2 days * $85
        notes: 'Presentation screen',
      },
    }),
  ]);

  console.log('Seeded database with:');
  console.log(`- ${products.length} products`);
  console.log(`- ${customers.length} customers`);
  console.log(`- 5 bookings with multiple items each`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
