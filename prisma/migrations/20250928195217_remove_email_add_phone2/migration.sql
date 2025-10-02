/*
  Warnings:

  - You are about to drop the column `email` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `customers` table. All the data in the column will be lost.
  - Added the required column `phone1` to the `customers` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_bookings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "startTime" TEXT NOT NULL DEFAULT '09:00',
    "endTime" TEXT NOT NULL DEFAULT '17:00',
    "totalAmount" REAL NOT NULL,
    "advancePayment" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
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
    "phone1" TEXT NOT NULL,
    "phone2" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_customers" ("address", "createdAt", "id", "name", "notes", "updatedAt") SELECT "address", "createdAt", "id", "name", "notes", "updatedAt" FROM "customers";
DROP TABLE "customers";
ALTER TABLE "new_customers" RENAME TO "customers";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
