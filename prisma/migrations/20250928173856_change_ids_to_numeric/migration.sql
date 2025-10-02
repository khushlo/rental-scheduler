/*
  Warnings:

  - The primary key for the `booking_items` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `bookingId` on the `booking_items` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `id` on the `booking_items` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `productId` on the `booking_items` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `bookings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `customerId` on the `bookings` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `id` on the `bookings` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `customers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `customers` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `products` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `products` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_booking_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "pricePerDay" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    "notes" TEXT,
    "bookingId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    CONSTRAINT "booking_items_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "booking_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_booking_items" ("bookingId", "id", "notes", "pricePerDay", "productId", "quantity", "subtotal") SELECT "bookingId", "id", "notes", "pricePerDay", "productId", "quantity", "subtotal" FROM "booking_items";
DROP TABLE "booking_items";
ALTER TABLE "new_booking_items" RENAME TO "booking_items";
CREATE TABLE "new_bookings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "startTime" TEXT NOT NULL DEFAULT '09:00',
    "endTime" TEXT NOT NULL DEFAULT '17:00',
    "totalAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "customerId" INTEGER NOT NULL,
    CONSTRAINT "bookings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_bookings" ("createdAt", "customerId", "endDate", "endTime", "id", "notes", "startDate", "startTime", "status", "totalAmount", "updatedAt") SELECT "createdAt", "customerId", "endDate", "endTime", "id", "notes", "startDate", "startTime", "status", "totalAmount", "updatedAt" FROM "bookings";
DROP TABLE "bookings";
ALTER TABLE "new_bookings" RENAME TO "bookings";
CREATE TABLE "new_customers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_customers" ("address", "createdAt", "email", "id", "name", "notes", "phone", "updatedAt") SELECT "address", "createdAt", "email", "id", "name", "notes", "phone", "updatedAt" FROM "customers";
DROP TABLE "customers";
ALTER TABLE "new_customers" RENAME TO "customers";
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");
CREATE TABLE "new_products" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "pricePerDay" REAL NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_products" ("category", "createdAt", "description", "id", "isActive", "name", "pricePerDay", "stock", "updatedAt") SELECT "category", "createdAt", "description", "id", "isActive", "name", "pricePerDay", "stock", "updatedAt" FROM "products";
DROP TABLE "products";
ALTER TABLE "new_products" RENAME TO "products";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
