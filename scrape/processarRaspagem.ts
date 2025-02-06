import puppeteer from "puppeteer";
import prisma from "../lib/prisma"; // A importação do Prisma

async function processarRaspagem(url: string, origem: string, destino: string) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  try {
    // Acessar o site
    await page.goto(url, { waitUntil: "networkidle2" });

    // Aguarda a presença do seletor principal
    await page.waitForSelector("main.col-xs-12.col-md-9.col-md-push-3");

    // Extrair os horários e os dias da semana
    const dados = await page.$$eval("main.col-xs-12.col-md-9.col-md-push-3", (elements) => {
      const horarios = [];
      elements.forEach((element) => {
        const text = (element as HTMLElement).innerText.trim();
        const lines = text.split("\n");

        let diaDaSemana = ""; // Inicializa a variável para guardar o dia da semana

        lines.forEach((line) => {
          if (line.includes("Horários de")) {
            // Atualiza o dia da semana com base no título
            diaDaSemana = line.replace("Horários de ", "").trim();
          } else if (/^\d{2}:\d{2}/.test(line)) {
            // Divide o horário e a observação
            const [horario, ...observacao] = line.split(" ");
            horarios.push({
              diaDaSemana,
              horario,
              observacao: observacao.join(" ").trim() || null,
            });
          }
        });
      });
      return horarios;
    });

    // Processar os dados e salvar no banco de dados
    if (dados.length > 0) {
      // Eliminar duplicidades antes de inserir novos dados
      await prisma.horario.deleteMany({
        where: {
          origem,
          destino,
          diaDaSemana: { in: dados.map((item) => item.diaDaSemana) },
          horario: { in: dados.map((item) => item.horario) },
        },
      });

      // Salvar os dados únicos no banco de dados
      await prisma.horario.createMany({
        data: dados.map((item) => ({
          origem,
          destino,
          diaDaSemana: item.diaDaSemana,
          horario: item.horario,
          tarifa: 7.75, // Atualize conforme necessário
          observacao: item.observacao,
        })),
      });
      console.log(`Inseridos ${dados.length} horários no banco de dados.`);
    } else {
      console.log("Nenhum dado encontrado para inserção.");
    }
  } catch (error) {
    console.error("Erro durante a raspagem:", error);
    throw new Error(`Erro ao acessar ou processar o site: ${error.message}`);
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

export default processarRaspagem;
