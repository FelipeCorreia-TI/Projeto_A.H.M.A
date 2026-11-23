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
  const ppFormTitle = document.getElementById("ppFormTitle");
  const ppBtnSubmit = document.getElementById("ppBtnSubmit");
  const ppCategorySelect = document.getElementById("ppCategory");

  // Upload e preview
  const ppPhotoInput = document.getElementById("ppPhotoInput");
  const ppPhotoPreview = document.getElementById("ppPhotoPreview");
  const ppPhotoPlaceholder = document.getElementById("ppPhotoPlaceholder");

  // Detalhes
  const ppDetailOverlay = document.getElementById("ppDetailOverlay");
  const ppDetailClose = document.getElementById("ppDetailClose");
  const ppDetailEdit = document.getElementById("ppDetailEdit");
  const ppDetailDelete = document.getElementById("ppDetailDelete");

  let listaPlantas = [];
  let listaCategorias = [];
  let plantaSelecionadaId = null;
  let plantaSelecionada = null; // planta aberta no modal de detalhes
  let plantaEmEdicao = null; // planta sendo editada no formulário (null = cadastro novo)
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

      arquivoFotoSelecionado = file;

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
    plantaEmEdicao = null;

    if (ppFormTitle) ppFormTitle.textContent = "Adicionar planta";
    if (ppBtnSubmit) ppBtnSubmit.textContent = "Salvar planta";

    if (ppPhotoPreview) {
      ppPhotoPreview.src = "";
      ppPhotoPreview.setAttribute("hidden", "true");
    }
    if (ppPhotoPlaceholder) {
      ppPhotoPlaceholder.style.display = "block";
    }
  }

  // Abre o formulário já preenchido com os dados da planta
  function abrirEdicao(planta) {
    resetarFormulario();
    plantaEmEdicao = planta;

    if (ppFormTitle) ppFormTitle.textContent = "Editar planta";
    if (ppBtnSubmit) ppBtnSubmit.textContent = "Salvar alterações";

    document.getElementById("ppName").value = planta.nome_popular || "";
    document.getElementById("ppScientific").value =
      planta.nome_cientifico || "";
    document.getElementById("ppInfo").value =
      planta.informacoes_adicionais || "";

    if (ppCategorySelect && planta.id_categoria != null) {
      ppCategorySelect.value = String(planta.id_categoria);
    }

    if (planta.foto_url && ppPhotoPreview) {
      ppPhotoPreview.src = planta.foto_url;
      ppPhotoPreview.removeAttribute("hidden");
      if (ppPhotoPlaceholder) ppPhotoPlaceholder.style.display = "none";
    }

    // Fecha o modal de detalhes e, ao terminar, abre o formulário
    fecharModal(ppDetailOverlay, () => abrirModal(ppFormOverlay));
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

  // CARREGAR PLANTAS COM CACHE INSTANTÂNEO + ATUALIZAÇÃO EM SEGUNDO PLANO
  async function carregarPlantas() {
    try {
      const data = await PlantService.listarPlantas((plantasDoCache) => {
        listaPlantas = plantasDoCache;
        renderizarPlantas(listaPlantas);
        console.log("⚡ Plantopédia exibida instantaneamente via cache local.");
      });

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
    plantaSelecionada = planta;

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

    const isAdmin = nivelAcessoUsuario !== "USER";

    if (ppDetailEdit) {
      ppDetailEdit.style.display = isAdmin ? "block" : "none";
    }
    if (ppDetailDelete) {
      ppDetailDelete.style.display = isAdmin ? "block" : "none";
    }

    abrirModal(ppDetailOverlay);
  }

  if (ppDetailEdit) {
    ppDetailEdit.onclick = () => {
      if (nivelAcessoUsuario === "USER") {
        alert("Ação não permitida para seu nível de acesso.");
        return;
      }
      if (plantaSelecionada) abrirEdicao(plantaSelecionada);
    };
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

      const editando = !!plantaEmEdicao;

      if (ppBtnSubmit) {
        ppBtnSubmit.disabled = true;
        ppBtnSubmit.textContent = "Salvando...";
        ppBtnSubmit.classList.add("ahma-carregando");
      }

      try {
        // Na edição, mantém a foto atual se nenhuma nova foi escolhida
        let foto_url = editando ? plantaEmEdicao.foto_url || null : null;

        if (arquivoFotoSelecionado) {
          foto_url = await PlantService.enviarFoto(arquivoFotoSelecionado);
        } else if (!editando && fotoBase64) {
          // Fallback apenas para cadastro novo
          foto_url = fotoBase64;
        }

        const payload = {
          nome_popular,
          nome_cientifico: nome_cientifico || null,
          id_categoria,
          informacoes_adicionais: informacoes_adicionais || null,
          foto_url,
        };

        if (editando) {
          await PlantService.atualizarPlanta(
            plantaEmEdicao.id_planta,
            payload,
            plantaEmEdicao.foto_url,
          );
        } else {
          await PlantService.adicionaPlanta(payload);
        }

        fecharModalCadastro();
        await carregarPlantas();
      } catch (err) {
        console.error("Erro ao salvar planta:", err);
        alert("Erro ao salvar planta, você está offline: " + err.message);
      } finally {
        if (ppBtnSubmit) {
          ppBtnSubmit.disabled = false;
          ppBtnSubmit.textContent = editando
            ? "Salvar alterações"
            : "Salvar planta";
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
          alert("Erro ao excluir planta, você está offline: " + err.message);
        }
      }
    };
  }

  // Inicialização encadeada
  await verificarNivelAcesso();
  await carregarCategorias();
  await carregarPlantas();

  // ATUALIZAÇÃO PERIÓDICA AUTOMÁTICA EM SEGUNDO PLANO (a cada 30 segundos)
  setInterval(() => {
    carregarPlantas();
  }, 30000);
});