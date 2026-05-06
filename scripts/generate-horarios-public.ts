import { writeFile, mkdir } from "fs/promises";
import path from "path";

import prisma from "../lib/prisma";
import { getRouteSourceUrl } from "../lib/routeSources";

async function writeSchedulesFile(schedules: unknown[]) {
  const publicDir = path.join(process.cwd(), "public");
  await mkdir(publicDir, { recursive: true });
  await writeFile(
    path.join(publicDir, "horarios.json"),
    JSON.stringify(schedules),
    "utf8"
  );
}

async function main() {
  if (!process.env.DATABASE_URL) {
    await writeSchedulesFile([]);
    console.warn("DATABASE_URL is not set; generated public/horarios.json with 0 schedules.");
    return;
  }

  const horarios = await prisma.horario.findMany({
    orderBy: { horario: "asc" },
  });

  const horariosComFonte = horarios.map((horario) => ({
    ...horario,
    sourceUrl: getRouteSourceUrl(horario),
  }));

  await writeSchedulesFile(horariosComFonte);

  console.log(`Generated public/horarios.json with ${horariosComFonte.length} schedules.`);
}

main()
  .catch((error) => {
    console.error("Failed to generate public/horarios.json:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
