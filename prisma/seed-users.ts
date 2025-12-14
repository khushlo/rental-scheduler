import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedTestUsers() {
  console.log('🌱 Seeding test login users...')

  try {
    // Hash passwords
    const hashedPassword1 = await bcrypt.hash('admin123', 10)
    const hashedPassword2 = await bcrypt.hash('user123', 10)

    // Create test users for tenant 1
    const users = await prisma.userLogin.createMany({
      data: [
        {
          username: 'admin',
          password: hashedPassword1,
          tenantId: 1,
          rowStatusCd: 'A',
          updatedBy: 'System',
        },
        {
          username: 'user1',
          password: hashedPassword2,
          tenantId: 1,
          rowStatusCd: 'A',
          updatedBy: 'System',
        },
      ],
      skipDuplicates: true,
    })

    console.log(`✅ Created ${users.count} test users`)
    
    console.log('\n📋 Test Login Credentials:')
    console.log('Username: admin | Password: admin123')
    console.log('Username: user1 | Password: user123')
    
  } catch (error) {
    console.error('❌ Error seeding test users:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedTestUsers()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })