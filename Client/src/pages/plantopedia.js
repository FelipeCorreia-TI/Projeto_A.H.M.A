import { PlantService } from "../services/plant-service.js";
import { _supabase } from "../config/supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const ppGrid = document.getElementById("ppGrid");
  const ppEmpty = document.getElementById("ppEmpty");
  const ppSearch = document.getElementById("ppSearch");
  const ppBtnAdd = document.getElementById("ppBtnAdd");

  // Botão Voltar do Header
  const btnVoltar = document.getElementById("btn-voltar");

  // Form e Inputs
  const ppFormOverlay = document.getElementById("ppFormOverlay");
  const ppFormClose = document.getElementById("ppFormClose");
  const ppFormCancel = document.getElementById("ppFormCancel");
  const ppForm = document.getElementById("ppForm");
  const ppBtnSubmit = document.getElementById("ppBtnSubmit");
  const ppCategorySelect = document.getElementById("ppCategory");

  // Upload e preview
  const ppPhotoInput = document.getElementById("ppPhotoInput");
  const ppPhotoPreview = document.getElementById("ppPhotoPreview");
  const ppPhotoPlaceholder = document.getElementById("ppPhotoPlaceholder");

  // Detalhes
  const ppDetailOverlay = document.getElementById("ppDetailOverlay");
  const ppDetailClose = document.getElementById("ppDetailClose");
  const ppDetailDelete = document.getElementById("ppDetailDelete");

  let listaPlantas = [];
  let listaCategorias = [];
  let plantaSelecionadaId = null;
  let fotoBase64 = null;
  let arquivoFotoSelecionado = null;
  let nivelAcessoUsuario = "USER";

  const DURACAO_FECHAR_MODAL = 320;

  function abrirModal(overlay) {
    overlay.removeAttribute("hidden");
    void overlay.offsetWidth;
    overlay.classList.add("ahma-aberto");
  }

  function fecharModal(overlay, aoFinalizar) {
    overlay.classList.remove("ahma-aberto");
    window.setTimeout(() => {
      overlay.setAttribute("hidden", "true");
      if (typeof aoFinalizar === "function") aoFinalizar();
    }, DURACAO_FECHAR_MODAL);
  }

  if (btnVoltar) {
    btnVoltar.addEventListener("click", (e) => {
      e.preventDefault();
      if (
        document.referrer &&
        document.referrer.includes(window.location.host)
      ) {
        window.history.back();
      } else {
        window.location.href = "hub.html";
      }
    });
  }

  async function verificarNivelAcesso() {
    try {
      const {
        data: { user },
      } = await _supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await _supabase
        .from("cadastro")
        .select("nivel_acesso")
        .eq("id_conta", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data && data.nivel_acesso) {
        nivelAcessoUsuario = String(data.nivel_acesso).trim().toUpperCase();
      }

      const isAdmin =
        nivelAcessoUsuario === "TI" || nivelAcessoUsuario === "AGRO";

      if (ppBtnAdd) {
        if (isAdmin) {
          ppBtnAdd.style.display = "";
          ppBtnAdd.removeAttribute("hidden");
        } else {
          ppBtnAdd.style.display = "none";
        }
      }
    } catch (err) {
      console.error("Erro ao verificar nível de acesso:", err);
    }
  }

  async function carregarCategorias() {
    try {
      const data = await PlantService.listarCategorias();
      listaCategorias = data || [];

      if (ppCategorySelect) {
        ppCategorySelect.innerHTML = "";
        listaCategorias.forEach((cat) => {
          const option = document.createElement("option");
          option.value = cat.id_categoria;
          option.textContent = cat.nome_categoria;
          ppCategorySelect.appendChild(option);
        });
      }
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
    }
  }

  if (ppPhotoInput) {
    ppPhotoInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      arquivoFotoSelecionado = file; // <- Adicionar esta linha

      const reader = new FileReader();
      reader.onload = (event) => {
        fotoBase64 = event.target.result;
        ppPhotoPreview.src = fotoBase64;
        ppPhotoPreview.removeAttribute("hidden");
        if (ppPhotoPlaceholder) ppPhotoPlaceholder.style.display = "none";
      };
      reader.readAsDataURL(file);
    };
  }

  function resetarFormulario() {
    ppForm.reset();
    fotoBase64 = null;
    arquivoFotoSelecionado = null;
    if (ppPhotoPreview) {
      ppPhotoPreview.src = "";
      ppPhotoPreview.setAttribute("hidden", "true");
    }
    if (ppPhotoPlaceholder) {
      ppPhotoPlaceholder.style.display = "block";
    }
  }

  if (ppBtnAdd) {
    ppBtnAdd.onclick = () => {
      if (nivelAcessoUsuario === "USER") {
        alert("Ação não permitida para seu nível de acesso.");
        return;
      }
      resetarFormulario();
      abrirModal(ppFormOverlay);
    };
  }

  const fecharModalCadastro = () => {
    fecharModal(ppFormOverlay, resetarFormulario);
  };

  if (ppFormClose) ppFormClose.onclick = fecharModalCadastro;
  if (ppFormCancel) ppFormCancel.onclick = fecharModalCadastro;

  const fecharModalDetalhes = () => fecharModal(ppDetailOverlay);
  if (ppDetailClose) ppDetailClose.onclick = fecharModalDetalhes;

  // 5. CARREGAR PLANTAS COM CACHE INSTANTÂNEO + ATUALIZAÇÃO EM SEGUNDO PLANO
  async function carregarPlantas() {
    try {
      const data = await PlantService.listarPlantas((plantasDoCache) => {
        // Exibe o cache na tela imediatamente se ele existir
        listaPlantas = plantasDoCache;
        renderizarPlantas(listaPlantas);
        console.log("⚡ Plantopédia exibida instantaneamente via cache local.");
      });

      // Atualiza a tela com os dados atualizados do Supabase
      listaPlantas = data || [];
      renderizarPlantas(listaPlantas);
      console.log("🔄 Plantopédia sincronizada com o Supabase.");
    } catch (err) {
      console.error("Erro ao carregar plantas:", err);
      if (listaPlantas.length === 0) {
        ppGrid.innerHTML = "";
        ppEmpty.hidden = false;
        ppEmpty.textContent =
          "Nenhuma planta encontrada. Que tal adicionar a primeira?";
      }
    }
  }

  function renderizarPlantas(plantas) {
    ppGrid.innerHTML = "";

    if (!plantas || plantas.length === 0) {
      ppEmpty.hidden = false;
      return;
    }

    ppEmpty.hidden = true;

    plantas.forEach((planta, indice) => {
      const card = document.createElement("article");
      card.className = "pp-card";
      card.style.setProperty("--i", indice);

      // Renderiza a imagem envolvida por um wrapper com transição suave
      const fotoHtml = planta.foto_url
        ? `<div class="pp-photo-wrapper">
             <img src="${planta.foto_url}" 
                  alt="${planta.nome_popular}" 
                  loading="lazy"
                  class="pp-img-loading"
                  onload="this.classList.add('pp-img-loaded')">
           </div>`
        : `<div class="pp-photo-placeholder">🌱</div>`;

      const nomeCategoria =
        planta.categoria_especimes?.nome_categoria || "Geral";

      card.innerHTML = `
        <div class="pp-card-photo">
          ${fotoHtml}
        </div>
        <div class="pp-card-body">
          <span class="pp-badge">${nomeCategoria}</span>
          <h4>${planta.nome_popular || "Sem nome"}</h4>
          <p>${planta.nome_cientifico || ""}</p>
        </div>
      `;

      card.onclick = () => abrirDetalhes(planta);
      ppGrid.appendChild(card);
    });
  }

  if (ppSearch) {
    ppSearch.oninput = (e) => {
      const termo = e.target.value.toLowerCase().trim();
      const filtradas = listaPlantas.filter(
        (p) =>
          (p.nome_popular && p.nome_popular.toLowerCase().includes(termo)) ||
          (p.nome_cientifico &&
            p.nome_cientifico.toLowerCase().includes(termo)),
      );
      renderizarPlantas(filtradas);
    };
  }

  function abrirDetalhes(planta) {
    plantaSelecionadaId = planta.id_planta;
    document.getElementById("ppDetailName").textContent =
      planta.nome_popular || "";
    document.getElementById("ppDetailScientific").textContent =
      planta.nome_cientifico || "";
    document.getElementById("ppDetailCategory").textContent =
      planta.categoria_especimes?.nome_categoria || "Geral";
    document.getElementById("ppDetailInfo").textContent =
      planta.informacoes_adicionais || "Sem informações adicionais.";

    const imgDetail = document.getElementById("ppDetailImg");
    const placeholderDetail = document.getElementById("ppDetailPlaceholder");

    if (planta.foto_url) {
      imgDetail.src = planta.foto_url;
      imgDetail.removeAttribute("hidden");
      if (placeholderDetail) placeholderDetail.hidden = true;
    } else {
      imgDetail.src = "";
      imgDetail.hidden = true;
      if (placeholderDetail) placeholderDetail.hidden = false;
    }

    if (ppDetailDelete) {
      if (nivelAcessoUsuario === "USER") {
        ppDetailDelete.style.display = "none";
      } else {
        ppDetailDelete.style.display = "block";
      }
    }

    abrirModal(ppDetailOverlay);
  }

  if (ppForm) {
    ppForm.onsubmit = async (e) => {
      e.preventDefault();

      if (nivelAcessoUsuario === "USER") {
        alert("Ação não permitida para seu nível de acesso.");
        return;
      }

      const nome_popular = document.getElementById("ppName").value.trim();
      const nome_cientifico = document
        .getElementById("ppScientific")
        .value.trim();
      const id_categoria = ppCategorySelect
        ? parseInt(ppCategorySelect.value)
        : null;
      const informacoes_adicionais = document
        .getElementById("ppInfo")
        .value.trim();

      if (!nome_popular) {
        alert("Por favor, preencha o nome popular da planta.");
        return;
      }

      if (ppBtnSubmit) {
        ppBtnSubmit.disabled = true;
        ppBtnSubmit.textContent = "Salvando...";
        ppBtnSubmit.classList.add("ahma-carregando");
      }

      try {
        // --- INÍCIO DA ALTERAÇÃO (Upload para o Storage) ---
        let foto_url = null;

        // Se o usuário selecionou uma foto pelo input de arquivo, faz o upload para o bucket
        if (arquivoFotoSelecionado) {
          foto_url = await PlantService.enviarFoto(arquivoFotoSelecionado);
        } else if (fotoBase64) {
          // Fallback caso ainda haja algo no fotoBase64
          foto_url = fotoBase64;
        }

        const payload = {
          nome_popular,
          nome_cientifico: nome_cientifico || null,
          id_categoria,
          informacoes_adicionais: informacoes_adicionais || null,
          foto_url: foto_url, // Guarda a URL do Supabase Storage
        };

        await PlantService.adicionaPlanta(payload);
        // --- FIM DA ALTERAÇÃO ---

        fecharModalCadastro();
        await carregarPlantas();
      } catch (err) {
        console.error("Erro ao salvar planta:", err);
        alert("Erro ao salvar planta no banco: " + err.message);
      } finally {
        if (ppBtnSubmit) {
          ppBtnSubmit.disabled = false;
          ppBtnSubmit.textContent = "Salvar planta";
          ppBtnSubmit.classList.remove("ahma-carregando");
        }
      }
    };
  }

  if (ppDetailDelete) {
    ppDetailDelete.onclick = async () => {
      if (nivelAcessoUsuario === "USER") {
        alert("Ação não permitida para seu nível de acesso.");
        return;
      }

      if (!plantaSelecionadaId) return;

      if (confirm("Tem certeza que deseja excluir esta planta?")) {
        try {
          await PlantService.deletarPlanta(plantaSelecionadaId);

          fecharModalDetalhes();
          await carregarPlantas();
        } catch (err) {
          console.error("Erro ao excluir:", err);
          alert("Erro ao excluir planta: " + err.message);
        }
      }
    };
  }

  // Inicialização encadeada
  await verificarNivelAcesso();
  await carregarCategorias();
  await carregarPlantas();

  // ATUALIZAÇÃO PERIÓDICA AUTOMÁTICA EM SEGUNDO PLANO (A cada 30 segundos)
  setInterval(() => {
    carregarPlantas();
  }, 30000);
});
