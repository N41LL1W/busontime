/*
  Warnings:

  - You are about to drop the column `destino` on the `Horario` table. All the data in the column will be lost.
  - You are about to drop the column `observacao` on the `Horario` table. All the data in the column will be lost.
  - You are about to drop the column `origem` on the `Horario` table. All the data in the column will be lost.
  - Added the required column `itinerario` to the `Horario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trajeto` to the `Horario` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `horario` on the `Horario` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Horario" DROP COLUMN "destino",
DROP COLUMN "observacao",
DROP COLUMN "origem",
ADD COLUMN     "itinerario" TEXT NOT NULL,
ADD COLUMN     "tarifa" DOUBLE PRECISION,
ADD COLUMN     "trajeto" TEXT NOT NULL,
DROP COLUMN "horario",
ADD COLUMN     "horario" TIMESTAMP(3) NOT NULL;
