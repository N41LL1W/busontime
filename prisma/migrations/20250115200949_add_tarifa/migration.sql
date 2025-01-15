/*
  Warnings:

  - You are about to drop the column `itinerario` on the `Horario` table. All the data in the column will be lost.
  - You are about to drop the column `trajeto` on the `Horario` table. All the data in the column will be lost.
  - Added the required column `destino` to the `Horario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `origem` to the `Horario` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Horario" DROP COLUMN "itinerario",
DROP COLUMN "trajeto",
ADD COLUMN     "destino" TEXT NOT NULL,
ADD COLUMN     "observacao" TEXT,
ADD COLUMN     "origem" TEXT NOT NULL,
ALTER COLUMN "horario" SET DATA TYPE TEXT;
