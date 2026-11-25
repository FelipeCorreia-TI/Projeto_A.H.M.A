import { _supabase } from "../config/supabase.js";

document.addEventListener("DOMContentLoaded", () => {
  sessionStorage.clear();

  const tabLogin = document.getElementById("tab-login");
  const tabCadastro = document.getElementById("tab-cadastro");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  // Dispara a animação de entrada assim que a página carrega
  if (loginForm) loginForm.classList.add("ahma-form-entrando");

  // 1. ALTERNÂNCIA DE ABAS (agora com troca suave em vez de instantânea)
  if (tabLogin && tabCadastro && loginForm && registerForm) {
    const trocarPara = (formMostrar, formEsconder, tabAtiva, tabInativa) => {
      // já está no form pedido, não faz nada
      if (formMostrar.style.display === "block") return;

      tabAtiva.classList.add("active");
      tabInativa.classList.remove("active");

      formEsconder.classList.remove("ahma-form-entrando");
      formEsconder.style.opacity = "0";
      formEsconder.style.transform = "translateY(-6px)";

      window.setTimeout(() => {
        formEsconder.style.display = "none";
        formMostrar.style.display = "block";
        // força reflow para reiniciar a animação
        void formMostrar.offsetWidth;
        formMostrar.classList.add("ahma-form-entrando");
        formMostrar.style.opacity = "";
        formMostrar.style.transform = "";
      }, 180);
    };

    tabLogin.onclick = (e) => {
      e.preventDefault();
      trocarPara(loginForm, registerForm, tabLogin, tabCadastro);
    };

    tabCadastro.onclick = (e) => {
      e.preventDefault();
      trocarPara(registerForm, loginForm, tabCadastro, tabLogin);
    };
  }

  // 2. MOSTRAR/OCULTAR SENHA - LOGIN

  function setupPasswordToggle(buttonId, inputId) {
    const btn = document.getElementById(buttonId);
    const input = document.getElementById(inputId);

    if (btn && input) {
      btn.addEventListener("click", () => {
        const isPass = input.type === "password";
        input.type = isPass ? "text" : "password";
        btn.textContent = isPass ? "🙈" : "👁";
        input.focus(); // Mantém o foco no input instantaneamente
      });
    }
  }

  // Ativa para o Login e para o Cadastro
  setupPasswordToggle("toggle-password", "password");
  setupPasswordToggle("toggle-reg-password", "reg-password");

  // Função auxiliar: mostra erro com pequeno "shake" (usada no login e no cadastro)
  function exibirErroComShake(elemento, mensagem) {
    if (!elemento) return;
    elemento.textContent = mensagem;
    elemento.style.display = "block";
    elemento.classList.remove("ahma-erro-ativo");
    void elemento.offsetWidth; // reinicia a animação se o erro já estava visível
    elemento.classList.add("ahma-erro-ativo");
  }

  // 4. SUBMISSÃO DE LOGIN
  if (loginForm) {
    loginForm.onsubmit = async (e) => {
      e.preventDefault();

      const emailInput = document.getElementById("email");
      const passwordInput = document.getElementById("password");
      const errorMessage = document.getElementById("error-message");
      const btnSubmit = document.getElementById("btn-login");

      const email = emailInput ? emailInput.value.trim() : "";
      const password = passwordInput ? passwordInput.value : "";

      if (errorMessage) {
        errorMessage.textContent = "";
        errorMessage.style.display = "none";
        errorMessage.classList.remove("ahma-erro-ativo");
      }

      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = "Entrando...";
      }

      try {
        const { data: authData, error: authError } =
          await _supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (authError) throw new Error("E-mail ou senha incorretos.");

        const { data: usuarioCadastro, error: cadastroError } = await _supabase
          .from("cadastro")
          .select("status")
          .eq("id_conta", authData.user.id)
          .maybeSingle();

        if (
          cadastroError ||
          !usuarioCadastro ||
          usuarioCadastro.status === false
        ) {
          await _supabase.auth.signOut();
          throw new Error(
            "Sua conta está inativa ou não cadastrada no sistema.",
          );
        }

        window.location.replace("hub.html");
      } catch (error) {
        console.error("Erro no login:", error);
        exibirErroComShake(errorMessage, error.message);
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = "Entrar";
        }
      }
    };
  }

  // 5. SUBMISSÃO DE CADASTRO
  if (registerForm) {
    registerForm.onsubmit = async (e) => {
      e.preventDefault();

      const regEmailInput = document.getElementById("reg-email");
      const regPasswordInput = document.getElementById("reg-password");
      const regErrorMsg = document.getElementById("reg-error-message");
      const btnRegister = document.getElementById("btn-register");

      const regEmail = regEmailInput ? regEmailInput.value.trim() : "";
      const regPassword = regPasswordInput ? regPasswordInput.value : "";

      // Reset de mensagens de erro
      if (regErrorMsg) {
        regErrorMsg.textContent = "";
        regErrorMsg.style.display = "none";
        regErrorMsg.style.color = "red";
        regErrorMsg.classList.remove("ahma-erro-ativo");
      }

      // --- VALIDAÇÕES DE LIMITE E REGRAS DE SENHA ---
      if (!regEmail || !regPassword) {
        exibirErroCadastro("Preencha todos os campos obrigatórios.");
        return;
      }

      // Limite mínimo
      if (regPassword.length < 6) {
        exibirErroCadastro("A senha deve ter no mínimo 6 caracteres.");
        return;
      }

      // Limite máximo
      if (regPassword.length > 20) {
        exibirErroCadastro("A senha deve ter no máximo 20 caracteres.");
        return;
      }

      // (Opcional) Regra extra: Exigir ao menos um número
      const temNumero = /\d/.test(regPassword);
      if (!temNumero) {
        exibirErroCadastro("A senha deve conter pelo menos um número.");
        return;
      }

      if (btnRegister) {
        btnRegister.disabled = true;
        btnRegister.textContent = "Cadastrando...";
      }

      try {
        const { data, error: authError } = await _supabase.auth.signUp({
          email: regEmail,
          password: regPassword,
        });

        if (authError) throw authError;

        // Trata usuário já existente quando o Supabase não lança erro explícito
        if (
          data?.user &&
          data.user.identities &&
          data.user.identities.length === 0
        ) {
          throw new Error("User already registered");
        }

        if (regErrorMsg) {
          regErrorMsg.style.color = "green";
          regErrorMsg.textContent = "Conta criada com sucesso! Faça login.";
          regErrorMsg.style.display = "block";
          regErrorMsg.classList.remove("ahma-erro-ativo");
        }

        setTimeout(() => {
          if (tabLogin) tabLogin.click();
        }, 2000);
      } catch (err) {
        console.error("Erro no cadastro:", err);

        let msg = err.message || "";
        if (
          msg.includes("User already registered") ||
          msg.includes("already exists") ||
          (err.status === 400 && msg.includes("already"))
        ) {
          exibirErroCadastro(
            "Este e-mail já está cadastrado. Faça login ou use outro e-mail.",
          );
        } else if (msg.includes("Password should be at least")) {
          exibirErroCadastro("A senha deve conter pelo menos 6 caracteres.");
        } else {
          exibirErroCadastro(
            "Ocorreu um erro ao criar a conta. Tente novamente.",
          );
        }
      } finally {
        if (btnRegister) {
          btnRegister.disabled = false;
          btnRegister.textContent = "Criar Conta";
        }
      }
    };
  }

  // Função auxiliar para exibir os erros de cadastro
  function exibirErroCadastro(mensagem) {
    const regErrorMsg = document.getElementById("reg-error-message");
    regErrorMsg.style.color = "red";
    exibirErroComShake(regErrorMsg, mensagem);
  }
});
