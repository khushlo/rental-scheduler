/*
  Warnings:

  - You are about to drop the column `status` on the `bookings` table. All the data in the column will be lost.

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
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "customerId" INTEGER NOT NULL,
    CONSTRAINT "bookings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_bookings" ("advancePayment", "createdAt", "customerId", "endDate", "endTime", "id", "notes", "startDate", "startTime", "totalAmount", "updatedAt") SELECT "advancePayment", "createdAt", "customerId", "endDate", "endTime", "id", "notes", "startDate", "startTime", "totalAmount", "updatedAt" FROM "bookings";
DROP TABLE "bookings";
ALTER TABLE "new_bookings" RENAME TO "bookings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
