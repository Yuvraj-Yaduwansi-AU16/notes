/*
  Warnings:

  - You are about to drop the `UserAuthMapping` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserAuthMapping" DROP CONSTRAINT "UserAuthMapping_userId_fkey";

-- DropTable
DROP TABLE "UserAuthMapping";
