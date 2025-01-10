-- CreateTable
CREATE TABLE "Horario" (
    "id" SERIAL NOT NULL,
    "origem" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "horario" TEXT NOT NULL,
    "diaDaSemana" TEXT NOT NULL,
    "observacao" TEXT,

    CONSTRAINT "Horario_pkey" PRIMARY KEY ("id")
);
