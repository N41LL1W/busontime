/*
  Warnings:

  - You are about to drop the column `destino` on the `Horario` table. All the data in the column will be lost.
  - You are about to drop the column `origem` on the `Horario` table. All the data in the column will be lost.
  - You are about to drop the column `tarifa` on the `Horario` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[rotaId,horario,diaDaSemana,sentido]` on the table `Horario` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `rotaId` to the `Horario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sentido` to the `Horario` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Horario" DROP COLUMN "destino",
DROP COLUMN "origem",
DROP COLUMN "tarifa",
ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "rotaId" INTEGER NOT NULL,
ADD COLUMN     "sentido" TEXT NOT NULL,
ADD COLUMN     "tipo" TEXT NOT NULL DEFAULT 'rodoviaria';

-- CreateTable
CREATE TABLE "Empresa" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rota" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "origem" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "linha" TEXT,
    "tarifaComum" DOUBLE PRECISION,
    "tarifaEstudante" DOUBLE PRECISION,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogRaspagem" (
    "id" SERIAL NOT NULL,
    "origem" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "empresaSlug" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "totalHorarios" INTEGER NOT NULL DEFAULT 0,
    "erro" TEXT,
    "executadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogRaspagem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_nome_key" ON "Empresa"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_slug_key" ON "Empresa"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Rota_empresaId_origem_destino_key" ON "Rota"("empresaId", "origem", "destino");

-- CreateIndex
CREATE UNIQUE INDEX "Horario_rotaId_horario_diaDaSemana_sentido_key" ON "Horario"("rotaId", "horario", "diaDaSemana", "sentido");

-- AddForeignKey
ALTER TABLE "Rota" ADD CONSTRAINT "Rota_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Horario" ADD CONSTRAINT "Horario_rotaId_fkey" FOREIGN KEY ("rotaId") REFERENCES "Rota"("id") ON DELETE CASCADE ON UPDATE CASCADE;
