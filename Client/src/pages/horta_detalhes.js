import { _supabase } from "../config/supabase.js";

// Mapeia o nome do arquivo HTML na URL para o id_horta fixo do banco de dados
function obterIdHortaURL() {
  const path = window.location.pathname; 
  const pagina = path.split("/").pop().toLowerCase(); // Ex: "horta_soja.html", "horta_dois.html"

  // Dicionário de equivalência (Nome do Arquivo -> ID no Banco)
  const mapaHortas = {
    "horta_soja.html": 1, // ID 1 no banco para horta_soja
    "horta_dois.html": 2, // ID 2 no banco para horta_dois
    "horta_tres.html": 3  // ID 3 no banco para horta_tres
  };

  return mapaHortas[pagina] || 1; // Se não encontrar, assume 1 por padrão
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
    // 1. BUSCAR A HORTA DIRETAMENTE PELO id_horta
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

    // Elementos do DOM
    const badgeStatus = document.querySelector(".badge-status");
    const elSensorAssoc = document.querySelector(".status-unassigned");
    const bannerConfig = document.querySelector(".config-banner");
    const elTituloHorta = document.querySelector(".header-titles h1");

    if (!horta) {
      if (badgeStatus) badgeStatus.textContent = "Sem configuração";
      if (bannerConfig) bannerConfig.style.display = "flex";
      return;
    }

    // Atualiza o título <h1> com o nome que está gravado no banco de dados
    if (elTituloHorta && horta.nome_horta) {
      elTituloHorta.textContent = horta.nome_horta;
    }

    if (bannerConfig) bannerConfig.style.display = "none";

    // Trata a relação com o sensor
    const sensorObj = Array.isArray(horta.sensor) ? horta.sensor[0] : horta.sensor;
    const idSensor = horta.id_sensor || sensorObj?.id_sensor;

    if (idSensor) {
      if (badgeStatus) badgeStatus.textContent = "Ativo";
      if (elSensorAssoc) {
        elSensorAssoc.textContent = sensorObj?.nome_sensor || `Sensor #${idSensor}`;
        elSensorAssoc.classList.remove("status-unassigned");
      }
      
      // 2. BUSCA AS ÚLTIMAS LEITURAS DO SENSOR CORRESPONDENTE
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
    const { data: leituras, error } = await _supabase
      .from("informacao_sensor")
      .select("*")
      .eq("id_sensor", idSensor)
      .order("data_hora", { ascending: false })
      .limit(10);

    if (error) throw error;

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
      return;
    }

    const ultimaLeitura = leituras[0];
    const valorUmidade = Number(ultimaLeitura.umidade);

    // Card 1: Umidade
    if (elUmidade) elUmidade.textContent = `${valorUmidade}%`;
    if (subUmidade) subUmidade.textContent = "Leitura recente";

    // Card 2: Condição
    const condicaoInfo = calcularCondicaoSolo(valorUmidade);
    if (elCondicao) elCondicao.textContent = condicaoInfo.texto;
    if (subCondicao) subCondicao.textContent = condicaoInfo.orientacao;

    // Card 3: Data e Hora
    const dataLeitura = new Date(ultimaLeitura.data_hora);
    if (elData) elData.textContent = dataLeitura.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    if (subData) subData.textContent = dataLeitura.toLocaleDateString("pt-BR");

    if (badgeLeituras) badgeLeituras.textContent = `${leituras.length} leituras`;

    const guideBox = document.querySelector(".guide-box");
    if (guideBox) {
      guideBox.innerHTML = `<strong>Status atual (${valorUmidade}%):</strong> ${condicaoInfo.orientacao}`;
    }

  } catch (err) {
    console.error("Erro ao carregar leituras:", err);
  }
}

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