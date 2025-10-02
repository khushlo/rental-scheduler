/*
  Warnings:

  - You are about to drop the column `productId` on the `bookings` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "booking_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "pricePerDay" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    "notes" TEXT,
    "bookingId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    CONSTRAINT "booking_items_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "booking_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_bookings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "totalAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "customerId" TEXT NOT NULL,
    CONSTRAINT "bookings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_bookings" ("createdAt", "customerId", "endDate", "id", "notes", "startDate", "status", "totalAmount", "updatedAt") SELECT "createdAt", "customerId", "endDate", "id", "notes", "startDate", "status", "totalAmount", "updatedAt" FROM "bookings";
DROP TABLE "bookings";
ALTER TABLE "new_bookings" RENAME TO "bookings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
