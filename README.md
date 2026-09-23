# Projeto A.H.M.A — Web APP🌱🤖

## Sistema de gestão de hortas e Plantopédia 💻

O Projeto A.H.M.A é uma aplicação web estática para gerenciamento de hortas, catálogo de espécies e visualização de leituras de umidade do solo. O software roda no navegador, utiliza JavaScript modular e se conecta diretamente ao Supabase para autenticação, banco de dados e armazenamento de imagens.


**Acessos do projeto:** 

[![Acessar o Aplicativo](https://img.shields.io/badge/ACESSAR_O_APLICATIVO-007acc?style=for-the-badge)](https://felipecorreia-ti.github.io/Projeto_AHMA/Client)
[![Acessar o Aplicativo](https://img.shields.io/badge/ACESSAR_A_DOCUMENTAÇÃO---?style=for-the-badge)](https://ahma-docs.lovable.app/)

## Sumário

- [O que o software faz](#o-que-o-software-faz)
- [Como a aplicação funciona](#como-a-aplicação-funciona)
- [Arquitetura do software](#arquitetura-do-software)
- [Stack e dependências](#stack-e-dependências)
- [Estrutura do cliente](#estrutura-do-cliente)
- [Pré-requisitos](#pré-requisitos)
- [Execução local](#execução-local)
- [Configuração do Supabase](#configuração-do-supabase)
- [Modelo de dados utilizado](#modelo-de-dados-utilizado)
- [Fluxo de autenticação](#fluxo-de-autenticação)
- [Perfis de acesso](#perfis-de-acesso)
- [Como usar a aplicação](#como-usar-a-aplicação)
- [Plantopédia](#plantopédia)
- [Monitoramento das hortas](#monitoramento-das-hortas)
- [PWA e cache](#pwa-e-cache)
- [Arquivos mais importantes](#arquivos-mais-importantes)
- [Limitações atuais do software](#limitações-atuais-do-software)
- [Manutenção e evolução](#manutenção-e-evolução)
- [Contribuição](#contribuição)
- [Desenvolvedores](#desenvolvedores)
- [Licença](#licença)
- [Referências](#referências)

---

## O que o software faz

O cliente web possui quatro áreas principais:

1. **Autenticação:** permite entrar no sistema e criar uma conta pelo Supabase Auth.
2. **Hub:** apresenta os caminhos principais depois do login.
3. **Plantopédia:** lista espécies, categorias, informações de cultivo e imagens.
4. **Monitoramento:** apresenta um painel independente para cada horta, com última leitura, condição do solo, histórico, tabela e faixas de referência.

A aplicação não possui um servidor próprio no repositório. As páginas são arquivos estáticos servidos por um servidor HTTP. O navegador executa os módulos JavaScript e faz as consultas diretamente ao Supabase.

---

## Como a aplicação funciona

O fluxo normal de uso é:

```text
Client/index.html
        ↓
Autenticação no Supabase Auth
        ↓
Validação do perfil em cadastro
        ↓
Client/hub.html
        ├── Client/plantopedia.html
        └── Client/sensores.html
                ├── monitoramento/horta_soja.html
                ├── monitoramento/horta_dois.html
                └── monitoramento/horta_tres.html
```

As páginas internas executam o `AuthGuard` antes de carregar dados protegidos. Se não houver sessão válida, se o perfil não existir ou se a conta estiver inativa, o usuário é redirecionado para `index.html`.

---

## Arquitetura do software 🏢

### Camada de apresentação

Os arquivos HTML definem a estrutura de cada tela. Os arquivos CSS organizam tokens visuais, tipografia, componentes compartilhados, responsividade e estilos específicos das páginas.

### Camada de serviços

Os módulos em `Client/src/services/` concentram operações de autenticação, logout e catálogo de plantas. Eles evitam que todas as páginas precisem repetir as consultas ao Supabase.

### Camada de configuração

`Client/src/config/supabase.js` cria o cliente Supabase usado pelo software. `Client/src/config/auth-guard.js` verifica sessão e perfil antes da abertura das páginas protegidas.

### Camada de dados

O Supabase fornece o Auth, o PostgreSQL e o Storage. O software utiliza a API JavaScript do Supabase carregada por CDN, portanto não há instalação de dependências no cliente.

---

## Stack e dependências 

- **HTML5:** estrutura das telas.
- **CSS3:** layout, identidade visual, responsividade e animações.
- **JavaScript ES Modules:** comportamento, consultas, autenticação e renderização.
- **Supabase JS v2:** cliente de autenticação, banco e Storage carregado por CDN [1].
- **PostgreSQL via Supabase:** persistência das entidades do sistema.
- **SVG:** desenho do gráfico de histórico de umidade.
- **Web App Manifest:** metadados para instalação como PWA.
- **Service Worker:** cache de arquivos estáticos.

O software não precisa de React, Vue, Angular, Tailwind, Node.js ou processo de compilação para ser executado. Um servidor HTTP estático é suficiente.

---

## Estrutura do cliente

```text
Client/
├── index.html                         # Login e cadastro
├── hub.html                           # Tela inicial
├── plantopedia.html                   # Catálogo de espécies
├── sensores.html                      # Seleção das hortas
├── monitoramento/
│   ├── horta_soja.html                # Painel da horta um
│   ├── horta_dois.html                # Painel da horta dois
│   └── horta_tres.html                # Painel da horta três
├── assets/
│   ├── css/
│   │   ├── base/                      # CSS base
│   │   ├── components/                # Componentes CSS
│   │   └── pages/                     # Estilos específicos
│   ├── icons/                          # Ícones da aplicação
│   └── images/                         # Imagens locais
├── src/
│   ├── auth/
│   │   └── auth-guard.js              # Proteção Login
│   ├── components/
│   │   └── menu-hamburger.js          # Menu compartilhado
│   ├── config/
│   │   ├── auth-guard.js              # Guard usado nas paginas
│   │   └── supabase.js                # Cliente Supabase
│   ├── pages/
│   │   ├── login.js                   # Login e cadastro
│   │   ├── plantopedia.js              # Lógica da Plantopédia
│   │   └── monitoramento.js            # Lógica das métricas
│   └── services/
│       ├── authService.js             # Serviço autenticação
│       ├── logout.js                   # Logout compartilhado
│       └── plant-service.js            # Consultas de plantas
├── manifest.json                      # Configuração PWA
└── sw.js                              # Service worker
```





## Pré-requisitos

Para executar a versão publicada ou local, são necessários:

- um navegador moderno com suporte a ES Modules;
- acesso à internet para carregar a biblioteca Supabase e consultar o projeto remoto;
- um servidor HTTP estático;
- um projeto Supabase configurado com as tabelas e políticas esperadas.

Não é necessário instalar dependências com `npm install` para executar a pasta `Client`.

---

## Execução local

### 1. Clonar o repositório

```bash
git clone https://github.com/FelipeCorreia-TI/Projeto_AHMA.git
cd Projeto_AHMA
```

### 2. Servir somente o cliente

Com Python:

```bash
python3 -m http.server 8080 --directory Client
```

Com Node.js:

```bash
npx serve Client
```

### 3. Abrir a página inicial

Acesse:

```text
http://localhost:8080/index.html
```

O endereço exato pode mudar quando `npx serve` escolher outra porta.

### Por que não abrir com duplo clique?

Abrir `Client/index.html` diretamente gera uma URL `file://`. Navegadores podem bloquear módulos ES e requisições de origem cruzada nesse modo. Use sempre um servidor HTTP local.

---

## Configuração do Supabase

O cliente principal está em:

```text
Client/src/config/supabase.js
```

Esse arquivo cria o cliente com:

```js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

export const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

Para usar outro projeto Supabase, substitua a URL e a chave pública pelo par correspondente ao novo ambiente.

A chave usada no navegador deve ser uma chave pública `anon` ou `publishable`. Nunca coloque no cliente uma `service_role key`, senha de banco, token privado ou segredo administrativo.

### Serviços usados pelo software

- **Auth:** login, cadastro, sessão e logout.
- **Database:** perfis, categorias, espécies, hortas, sensores e leituras.
- **Storage:** fotos da Plantopédia.
- **API:** consultas e alterações feitas pelos módulos JavaScript.

### Políticas necessárias

A configuração do Supabase precisa definir:

- quem pode ler o próprio perfil;
- quem pode listar e cadastrar espécies;
- quem pode excluir espécies;
- quem pode ler e alterar categorias;
- quem pode consultar hortas, sensores e leituras;
- quem pode enviar, ler e remover fotos do bucket usado pela Plantopédia.

O frontend não deve ser considerado uma camada suficiente de autorização. As permissões reais devem estar nas políticas RLS, nas políticas de Storage e nas regras do banco.

---

## Modelo de dados utilizado

O software consulta as seguintes tabelas ou entidades:

| Entidade | Uso no software | Campos observados |
| --- | --- | --- |
| `cadastro` | Perfil adicional do usuário autenticado | `id_conta`, `email`, `nome`, `nivel_acesso`, `status` |
| `categoria_especimes` | Categorias da Plantopédia | `id_categoria`, `nome_categoria` |
| `especimes` | Espécies cadastradas | `id_planta`, `nome_popular`, `nome_cientifico`, `informacoes_adicionais`, `foto_url`, `id_categoria` |
| `sensor` | Sensor associado à horta | `id_sensor`, `nome_sensor` |
| `horta` | Hortas exibidas nos dashboards | `id_horta`, `nome_horta`, `id_sensor` |
| `informacao_sensor` | Histórico de umidade | `id_resposta`, `umidade`, `data_hora`, `id_sensor` |
| `horta_planta` | Associação entre hortas e espécies | `id_horta`, `id_planta` |

Os nomes precisam permanecer consistentes com as consultas do cliente. Alterações de tabela ou coluna exigem atualização dos serviços e das páginas que consomem esses dados.

---

## Fluxo de autenticação

### Login

`Client/src/pages/login.js`:

1. lê e-mail e senha do formulário;
2. chama `signInWithPassword` no Supabase Auth;
3. consulta o perfil em `cadastro` usando `id_conta`;
4. encerra a sessão se o perfil não existir ou estiver inativo;
5. encaminha o usuário para `hub.html` quando a validação termina.

### Cadastro

O formulário de cadastro:

- exige e-mail e senha;
- aceita senha entre 6 e 20 caracteres;
- exige ao menos um número;
- chama `supabase.auth.signUp`;
- mostra mensagem de sucesso ou erro;
- retorna à aba de login depois da criação.

O cadastro no Auth e o perfil em `cadastro` são responsabilidades diferentes. Se o fluxo exigir que toda nova conta tenha um perfil ativo.

### Proteção de rota

`Client/src/config/auth-guard.js`:

1. busca a sessão atual com `getSession`;
2. consulta `cadastro` usando o ID do usuário autenticado;
3. verifica `nivel_acesso` e `status`;
4. identifica perfis administrativos `TI` e `AGRO`;
5. redireciona para `index.html` se a sessão ou o perfil forem inválidos.

---

## Perfis de acesso

O software reconhece os seguintes valores de `nivel_acesso`:

| Perfil | Interpretação no cliente |
| --- | --- |
| `TI` | Perfil administrativo técnico |
| `AGRO` | Perfil administrativo ligado ao domínio agrícola |
| `USER` ou `COMUM` | Usuário comum |

O guard atual calcula `eAdmin` para `TI` e `AGRO`. A aplicação pode usar essa informação para mostrar ou ocultar ações administrativas, mas a regra definitiva deve ser aplicada no Supabase.

---

## Como usar a aplicação

### Entrar

1. Abra `index.html`.
2. Preencha e-mail e senha.
3. Se a conta existir, estiver ativa e possuir perfil válido, o sistema abrirá `hub.html`.
4. Use o botão de saída para encerrar a sessão e retornar ao login.

### Cadastrar uma conta

1. Selecione a aba **Cadastrar**.
2. Informe e-mail e senha.
3. Use uma senha com 6 a 20 caracteres e pelo menos um número.
4. Envie o formulário.
5. Faça login depois da mensagem de confirmação.

### Acessar a Plantopédia

1. No hub, selecione **Plantopédia**.
2. Consulte a lista de espécies e categorias.
3. Use as ações disponíveis para cadastrar ou excluir uma planta conforme o perfil e as políticas do Supabase.
4. Para uma nova foto, envie o arquivo pelo formulário do catálogo.
5. A imagem será enviada para o bucket `plantas-fotos` e a URL pública será salva em `foto_url`.

O serviço `plant-service.js` mantém um cache leve das plantas em `localStorage` com a chave `ahma_cache_plantas`. Imagens em Base64 não são mantidas no cache para reduzir o espaço ocupado.

### Acessar o monitoramento

1. No hub, selecione **Monitoramento do Solo**.
2. Escolha uma das três hortas.
3. Aguarde a consulta ao Supabase.
4. Consulte a umidade atual, a condição, a data, o sensor, o gráfico e a tabela.
5. Use **Atualizar** para consultar novamente.

Se não houver horta, sensor ou leitura, o painel informa qual configuração está faltando.

---

## Plantopédia

O serviço `Client/src/services/plant-service.js` possui as seguintes operações:

- `listarPlantas()`: consulta espécies, categoria relacionada e URL da foto;
- `listarCategorias()`: consulta as categorias disponíveis;
- `adicionaPlanta(dadosPlanta)`: insere uma espécie em `especimes`;
- `deletarPlanta(id)`: exclui uma espécie pelo `id_planta`;
- `enviarFoto(arquivo)`: envia uma imagem para o bucket `plantas-fotos`;
- `deletarFotoStorage(fotoUrl)`: remove uma foto pelo nome do arquivo.

As operações dependem das políticas de acesso do Supabase. Um erro no serviço normalmente indica configuração incorreta de tabela, coluna, bucket ou política.

---

## Monitoramento das hortas (Em desenvolvimento 🛑)

O módulo `Client/src/pages/monitoramento.js`:

1. identifica a página atual;
2. associa a página à horta correspondente;
3. consulta `horta` por `id_horta`, `nome_horta` e `id_sensor`;
4. consulta o sensor associado;
5. consulta as leituras em `informacao_sensor`;
6. limita os valores de umidade entre `0` e `100`;
7. ordena as leituras por data;
8. mostra o registro mais recente;
9. desenha o gráfico em SVG;
10. renderiza as seis faixas de referência;
11. mostra as seis leituras mais recentes na tabela.

A classificação do cliente é:

| Intervalo | Classe |
| --- | --- |
| `0–16%` | Muito seco |
| `17–33%` | Seco |
| `34–50%` | Umidade baixa |
| `51–67%` | Ideal |
| `68–83%` | Úmido |
| `84–100%` | Muito úmido |

O dashboard não cria leituras fictícias. Um estado vazio significa que os dados esperados ainda não estão cadastrados ou disponíveis.

---

## PWA e cache

O arquivo `Client/manifest.json` define o nome, as cores, os ícones e o modo de instalação do aplicativo. O `Client/sw.js` registra um service worker para cachear recursos estáticos.

O cache não substitui o Supabase. Sem dados previamente carregados, sem sessão válida ou sem rede para consultar dados novos, a aplicação pode não conseguir preencher todas as telas. O comportamento offline deve ser tratado como uma melhoria progressiva, não como garantia de funcionamento integral.

---

## Arquivos mais importantes

| Arquivo | Responsabilidade |
| --- | --- |
| `Client/index.html` | Entrada pública, login e cadastro |
| `Client/hub.html` | Navegação principal após o login |
| `Client/plantopedia.html` | Estrutura do catálogo |
| `Client/sensores.html` | Seleção da horta a monitorar |
| `Client/src/pages/login.js` | Eventos e validações de login/cadastro |
| `Client/src/pages/plantopedia.js` | Estado e interface da Plantopédia |
| `Client/src/pages/monitoramento.js` | Consultas e renderização dos dashboards |
| `Client/src/services/plant-service.js` | Operações do catálogo e Storage |
| `Client/src/config/supabase.js` | Cliente Supabase |
| `Client/src/config/auth-guard.js` | Proteção das rotas internas |
| `Client/src/components/menu-hamburger.js` | Navegação compartilhada |
| `Client/sw.js` | Cache do PWA |

---

## Limitações atuais do software

- O sistema depende de um projeto Supabase remoto configurado corretamente.
- A chave pública do Supabase fica no cliente; os dados precisam estar protegidos por RLS.
- O cadastro de Auth e o perfil em `cadastro` podem exigir uma rotina adicional para permanecerem sincronizados.
- Existem duas implementações de guard no repositório; o arquivo em `config` é o usado pelas páginas atuais de monitoramento.
- O serviço `authService.js` possui imports e convenções de uma implementação anterior; o fluxo ativo deve ser mantido alinhado a `config/supabase.js` e `pages/login.js`.
- O dashboard mostra dados do banco, mas não gera telemetria por conta própria.
- O cache de plantas é local e pode ficar desatualizado até uma nova consulta ao Supabase.
- O modo offline cobre principalmente arquivos estáticos; não garante autenticação nem atualização de dados sem rede.

---

## Manutenção e evolução

Ao alterar o software, siga esta ordem:

1. Identifique a página que apresenta o comportamento.
2. Localize o módulo de serviço ou configuração usado por ela.
3. Confirme os nomes das tabelas e colunas consultadas.
4. Verifique RLS e políticas do Storage antes de concluir que o erro está no frontend.
5. Execute o cliente em um servidor HTTP local.
6. Teste login, logout, carregamento da página, estado vazio e estado com dados.
7. Atualize este README quando a forma de instalar, configurar ou usar o software mudar.
8. Atualize `documentação.md` quando a arquitetura ou o modelo de dados mudar.

Não publique senhas, tokens privados, chaves administrativas ou dados reais de usuários.

---

## Contribuição

Para contribuir, crie uma branch, faça uma alteração isolada, teste o fluxo afetado e abra um pull request com a descrição do problema e da solução. Alterações que envolvam banco de dados devem informar as tabelas, colunas, políticas e migrações necessárias.

---

## Desenvolvedores

Projeto desenvolvido por **Felipe Correia**, **Yago Montouro** e **Pedro Hiago**.

---

## Licença

O projeto é distribuído sob a licença MIT. Consulte [`LICENSE`](LICENSE).

---

## Referências

A implementação utiliza as documentações oficiais das tecnologias empregadas [1] [2] [3].

[1]: https://supabase.com/docs "Supabase Documentation"
[2]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules "MDN Web Docs — JavaScript modules"
[3]: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps "MDN Web Docs — Progressive Web Apps"

[Supabase Documentation — Database, Auth, Storage e Row Level Security](https://supabase.com/docs)

[MDN Web Docs — Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

[MDN Web Docs — Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) 

[Repositório oficial do Projeto A.H.M.A](https://github.com/FelipeCorreia-TI/Projeto_AHMA)

[Aplicação web publicada do Projeto A.H.M.A](https://felipecorreia-ti.github.io/Projeto_AHMA/Client/ )
