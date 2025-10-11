import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateDefaultTenantWithStoreInfo() {
  try {
    // Update the default tenant (ID 1) with store information from .env
    const updatedTenant = await prisma.tenant.update({
      where: { id: 1 },
      data: {
        storeName: process.env.NEXT_PUBLIC_STORE_NAME || 'Adiman Art',
        storeTagline: process.env.NEXT_PUBLIC_STORE_TAGLINE || 'A customized wedding store',
        storeAddress: process.env.NEXT_PUBLIC_STORE_ADDRESS || '123 Wedding Street, Art District, City 123456',
        storePhone: process.env.NEXT_PUBLIC_STORE_PHONE || '+91 9876543210',
        storeEmail: process.env.NEXT_PUBLIC_STORE_EMAIL || 'info@adimanart.com',
        storeTheme: 'light',
        storeCurrency: 'INR',
        storeTimezone: 'Asia/Kolkata'
      }
    })

    console.log('✅ Updated default tenant with store information:', updatedTenant.name)
  } catch (error) {
    console.error('❌ Error updating default tenant:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateDefaultTenantWithStoreInfo()