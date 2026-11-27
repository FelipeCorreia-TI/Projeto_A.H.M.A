import { _supabase } from "../config/supabase.js";

let meuGrafico = null; // Variável global para armazenar a instância do Chart.js

// Mapeia o nome do arquivo HTML na URL para o id_horta fixo do banco de dados
function obterIdHortaURL() {
  const path = window.location.pathname;
  const pagina = path.split("/").pop().toLowerCase();

  // Dicionário de equivalência (Nome da página -> id_horta no banco)
  const mapaHortas = {
    "horta_soja.html": 1, // ID 1 no banco para horta_soja
    "horta_dois.html": 2, // ID 2 no banco para horta_dois
    "horta_tres.html": 3  // ID 3 no banco para horta_tres
  };

  return mapaHortas[pagina] || 1; // Padrão 1 caso a página não esteja listada
}

const ID_HORTA_ATUAL = obterIdHortaURL();

document.addEventListener("DOMContentLoaded", async () => {
  const btnAtualizar = document.getElementById("btnAtualizar");

  if (btnAtualizar) {
    btnAtualizar.addEventListener("click", () => {
      carregarDadosHorta();
    });
  }

  await carregarDadosHorta();
});

async function carregarDadosHorta() {
  try {
    // 1. BUSCA A HORTA E O SENSOR ASSOCIADO NO SUPABASE
    const { data: horta, error: errorHorta } = await _supabase
      .from("horta")
      .select(`
        id_horta,
        nome_horta,
        id_sensor,
        sensor (
          id_sensor,
          nome_sensor
        )
      `)
      .eq("id_horta", ID_HORTA_ATUAL)
      .maybeSingle();

    if (errorHorta) throw errorHorta;

    // Elementos da Interface
    const badgeStatus = document.querySelector(".badge-status");
    const elSensorAssoc = document.querySelector(".status-unassigned");
    const bannerConfig = document.querySelector(".config-banner");
    const elTituloHorta = document.querySelector(".header-titles h1");

    if (!horta) {
      if (badgeStatus) badgeStatus.textContent = "Sem configuração";
      if (bannerConfig) bannerConfig.style.display = "flex";
      return;
    }

    // Atualiza o título <h1> com o nome vindo do banco
    if (elTituloHorta && horta.nome_horta) {
      elTituloHorta.textContent = horta.nome_horta;
    }

    if (bannerConfig) bannerConfig.style.display = "none";

    // Pega o id_sensor do relacionamento
    const sensorObj = Array.isArray(horta.sensor) ? horta.sensor[0] : horta.sensor;
    const idSensor = horta.id_sensor || sensorObj?.id_sensor;

    if (idSensor) {
      if (badgeStatus) badgeStatus.textContent = "Ativo";
      if (elSensorAssoc) {
        elSensorAssoc.textContent = sensorObj?.nome_sensor || `Sensor #${idSensor}`;
        elSensorAssoc.classList.remove("status-unassigned");
      }
      
      // 2. BUSCA AS LEITURAS DE UMIDADE
      await carregarUltimasLeituras(idSensor);
    } else {
      if (badgeStatus) badgeStatus.textContent = "Sem Sensor";
      if (elSensorAssoc) {
        elSensorAssoc.textContent = "Não associado";
        elSensorAssoc.classList.add("status-unassigned");
      }
    }

  } catch (err) {
    console.error("Erro ao carregar dados da horta:", err);
  }
}

async function carregarUltimasLeituras(idSensor) {
  try {
    // Busca na tabela informacao_sensor ordenando da mais recente para a mais antiga
    const { data: leituras, error } = await _supabase
      .from("informacao_sensor")
      .select("*")
      .eq("id_sensor", idSensor)
      .order("data_hora", { ascending: false })
      .limit(10);

    if (error) throw error;

    // Elementos dos Cards
    const cards = document.querySelectorAll(".metric-card");
    const elUmidade = cards[0]?.querySelector(".metric-value");
    const subUmidade = cards[0]?.querySelector(".metric-subtext");

    const elCondicao = cards[1]?.querySelector(".metric-value");
    const subCondicao = cards[1]?.querySelector(".metric-subtext");

    const elData = cards[2]?.querySelector(".metric-value");
    const subData = cards[2]?.querySelector(".metric-subtext");

    const badgeLeituras = document.querySelector(".readings-badge");

    if (!leituras || leituras.length === 0) {
      if (elUmidade) elUmidade.textContent = "—";
      if (subUmidade) subUmidade.textContent = "Aguardando leitura";
      if (badgeLeituras) badgeLeituras.textContent = "0 leituras";
      renderizarGrafico([], []);
      return;
    }

    const ultimaLeitura = leituras[0];
    const valorUmidade = Number(ultimaLeitura.umidade);

    // Card 1: Umidade
    if (elUmidade) elUmidade.textContent = `${valorUmidade}%`;
    if (subUmidade) subUmidade.textContent = "Leitura recente";

    // Card 2: Condição do Solo
    const condicaoInfo = calcularCondicaoSolo(valorUmidade);
    if (elCondicao) elCondicao.textContent = condicaoInfo.texto;
    if (subCondicao) subCondicao.textContent = condicaoInfo.orientacao;

    // Card 3: Data e Hora da leitura
    const dataLeitura = new Date(ultimaLeitura.data_hora);
    if (elData) elData.textContent = dataLeitura.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    if (subData) subData.textContent = dataLeitura.toLocaleDateString("pt-BR");

    if (badgeLeituras) badgeLeituras.textContent = `${leituras.length} leituras`;

    // Guia de Orientação
    const guideBox = document.querySelector(".guide-box");
    if (guideBox) {
      guideBox.innerHTML = `<strong>Status atual (${valorUmidade}%):</strong> ${condicaoInfo.orientacao}`;
    }

    // CONFIGURAÇÃO DO GRÁFICO (Inverte para ordem cronológica: antiga -> recente)
    const leiturasOrdenadas = [...leituras].reverse();

    const rotulos = leiturasOrdenadas.map((l) =>
      new Date(l.data_hora).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );

    const valores = leiturasOrdenadas.map((l) => Number(l.umidade));

    renderizarGrafico(rotulos, valores);

  } catch (err) {
    console.error("Erro ao carregar leituras:", err);
  }
}

// RENDERIZAÇÃO DO GRÁFICO VIA CHART.JS
function renderizarGrafico(labels, dados) {
  const canvas = document.getElementById("graficoUmidade");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // Destrói instância anterior antes de recriar
  if (meuGrafico) {
    meuGrafico.destroy();
  }

  meuGrafico = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Umidade (%)",
          data: dados,
          borderColor: "#2e7d32",
          backgroundColor: "rgba(46, 125, 50, 0.15)",
          borderWidth: 3,
          fill: true,
          tension: 0.3,
          pointRadius: 5,
          pointBackgroundColor: "#1b5e20",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: "Umidade (%)",
          },
        },
        x: {
          title: {
            display: true,
            text: "Horário da leitura",
          },
        },
      },
    },
  });
}

// INTERPRETAÇÃO DAS FAIXAS DE UMIDADE DO ARDUINO
function calcularCondicaoSolo(porcentagem) {
  if (porcentagem <= 18) {
    return { texto: "Muito seco", orientacao: "Necessita de irrigação urgente." };
  } else if (porcentagem <= 33) {
    return { texto: "Seco", orientacao: "Inicie o ciclo de rega em breve." };
  } else if (porcentagem <= 50) {
    return { texto: "Umidade baixa", orientacao: "Solo levemente seco. Mantenha a atenção." };
  } else if (porcentagem <= 67) {
    return { texto: "Ideal", orientacao: "Nível de umidade perfeito para o cultivo." };
  } else if (porcentagem <= 83) {
    return { texto: "Úmido", orientacao: "Solo bem irrigado. Não é necessário regar." };
  } else {
    return { texto: "Muito úmido", orientacao: "Atenção para acúmulo de água no solo." };
  }
}