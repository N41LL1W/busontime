const axios = require('axios');
const cheerio = require('cheerio');

const scrapeHorarios = async () => {
  const url = 'https://www.ribetransporte.com.br/ribeirao-preto-a-jardinopolis/';

  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);
    const horarios = [];
    const regexHorario = /(\d{2}:\d{2})/g; // Captura horários no formato HH:MM

    const extrairHorarios = (titulo, diaDaSemana) => {
      $(titulo).next('p').text().split('\n').forEach((linha) => {
        const match = linha.match(regexHorario);
        if (match) {
          horarios.push({
            horario: match[0],
            diaDaSemana,
            itinerario: 'Ribeirão Preto a Jardinópolis',
          });
        }
      });
    };

    extrairHorarios('h2:contains("Horários de Segunda à Sexta")', 'Segunda à Sexta');
    extrairHorarios('h2:contains("Horários de Sábado")', 'Sábado');
    extrairHorarios('h2:contains("Horários de Domingo e Feriados")', 'Domingo e Feriados');

    console.log(horarios);
    return horarios;
  } catch (error) {
    console.error('Erro ao realizar a raspagem:', error);
  }
};

scrapeHorarios();
