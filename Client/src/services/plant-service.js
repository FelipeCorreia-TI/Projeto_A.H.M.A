// Aqui será criado a lógica por trás do SELECT para as informações do DB
import { _supabase } from "../config/supabase.js";

const CACHE_PLANTAS_KEY = "ahma_cache_plantas";

const PlantService = {
  async listarPlantas(onCacheLoaded = null) {
    // 1. CARREGAR DO CACHE INSTANTANEAMENTE (se houver)
    const cacheLocal = localStorage.getItem(CACHE_PLANTAS_KEY);
    if (cacheLocal) {
      try {
        const plantasCache = JSON.parse(cacheLocal);
        if (typeof onCacheLoaded === "function") {
          onCacheLoaded(plantasCache);
        }
      } catch (err) {
        console.warn("Falha ao processar cache das plantas:", err);
      }
    }

    // 2. BUSCAR DADOS ATUALIZADOS DO SUPABASE
    const { data, error } = await _supabase
      .from("especimes")
      .select(
        `
          id_planta,
          nome_popular,
          nome_cientifico,
          informacoes_adicionais,
          foto_url,
          categoria_especimes(
              id_categoria,
              nome_categoria
          )
          `,
      )
      .order("id_planta", { ascending: false });

    if (error) {
      console.error("Erro no supabase ao listar plantas:", error.message);
      throw error;
    }

    // 3. ATUALIZAR O CACHE SEM AS IMAGENS EM BASE64 (Para economizar espaço)
    if (data) {
      try {
        // Filtra os dados removendo strings de fotos em Base64 antes de salvar no localStorage
        const dadosLevesParaCache = data.map((planta) => ({
          ...planta,
          foto_url:
            planta.foto_url && planta.foto_url.startsWith("data:")
              ? null
              : planta.foto_url,
        }));

        localStorage.setItem(
          CACHE_PLANTAS_KEY,
          JSON.stringify(dadosLevesParaCache),
        );
      } catch (err) {
        console.warn(
          "[PWA] Não foi possível salvar o cache leve no localStorage:",
          err,
        );
      }
    }

    return data;
  },

  async listarCategorias() {
    const { data, error } = await _supabase
      .from("categoria_especimes")
      .select("id_categoria, nome_categoria");

    if (error) throw error;
    return data;
  },

  async adicionaPlanta(dadosPlanta) {
    const { data, error } = await _supabase
      .from("especimes")
      .insert([
        {
          nome_popular: dadosPlanta.nome_popular,
          nome_cientifico: dadosPlanta.nome_cientifico,
          informacoes_adicionais: dadosPlanta.informacoes_adicionais,
          id_categoria: dadosPlanta.id_categoria,
          foto_url: dadosPlanta.foto_url || null,
        },
      ])
      .select();
    if (error) {
      console.error("Erro ao salvar planta no Supabase:", error.message);
      throw error;
    }
    return data;
  },

  async deletarPlanta(id) {
    const { error } = await _supabase
      .from("especimes")
      .delete()
      .eq("id_planta", id);
    if (error) {
      console.error("Erro ao deletar a planta:", error.message);
      throw true;
    }
    return true;
  },

  async enviarFoto(arquivo) {
    if (!arquivo) return null;

    const nomeArquivo = `${Date.now()}_${arquivo.name}`;

    const { data, error } = await _supabase.storage
      .from("plantas-fotos")
      .upload(nomeArquivo, arquivo);

    if (error) {
      console.error("Erro ao enviar foto para o Storage:", error.message);
      throw error;
    }

    const { data: publicUrlData } = _supabase.storage
      .from("plantas-fotos")
      .getPublicUrl(nomeArquivo);

    return publicUrlData.publicUrl;
  },

  async deletarFotoStorage(fotoUrl) {
    if (!fotoUrl) return;

    try {
      const urlLimpa = fotoUrl.split("?")[0];
      const nomeArquivo = urlLimpa.substring(urlLimpa.lastIndexOf("/") + 1);

      if (!nomeArquivo) return;

      const { data, error } = await _supabase.storage
        .from("plantas-fotos")
        .remove([nomeArquivo]);

      if (error) {
        console.error("Erro ao deletar imagem do Storage:", error.message);
      } else {
        console.log("Imagem removida com sucesso do Storage:", data);
      }
    } catch (err) {
      console.error("Falha ao processar deleção da foto:", err);
    }
  },
};

export { PlantService };
