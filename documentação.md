# PROJETO AHMA
**SISTEMA INTEGRADO DE MONITORAMENTO DE HORTAS URBANAS VIA IOT E PROGRESSIVE WEB APP**

---

## RESUMO

O Projeto AHMA consiste no desenvolvimento de uma solução tecnológica integrada para o monitoramento contínuo de umidade do solo em hortas urbanas e a gestão de um catálogo botânico digital (*Plantopédia*). O sistema é composto por uma camada de hardware baseada em Internet das Coisas (IoT), utilizando a plataforma Arduino Uno conectada a um higrômetro de solo, um Backend as a Service (BaaS) provido pelo Supabase para autenticação, banco de dados relacional PostgreSQL e armazenamento de mídias, além de uma interface web desenvolvida sob o conceito de *Progressive Web App* (PWA) hospedada no GitHub Pages. As medições analógicas são convertidas em escala percentual para a tomada de decisão sobre irrigação.

**Palavras-chave:** Internet das Coisas. Progressive Web App. Monitoramento Agrícola. Supabase. Arduino.

---

## SUMÁRIO

1. **INTRODUÇÃO**  
   1.1 Contextualização e Problema  
   1.2 Objetivos  
   1.3 Justificativa  
2. **ARQUITETURA DO SISTEMA E TECNOLOGIAS**  
   2.1 *Progressive Web App* (PWA) e Frontend  
   2.2 Backend as a Service (BaaS) — Supabase  
   2.3 Hospedagem e Implantação  
3. **HARDWARE E TELEMETRIA IOT**  
   3.1 Componentes Eletrônicos  
   3.2 Mapeamento de Pinagem e Conexões  
   3.3 Regras de Negócio e Limiares de Umidade  
4. **MODELAGEM E BANCO DE DADOS**  
   4.1 Dicionário de Dados  
   4.2 Script de Definição de Dados (DDL)  
5. **ESTRUTURA DO CÓDIGO E MÓDULOS**  
   5.1 Organização do Repositório  
   5.2 Funcionalidades dos Módulos  
6. **CONCLUSÃO**  
7. **REFERÊNCIAS**  

---

## 1 INTRODUÇÃO

### 1.1 Contextualização e Problema
A agricultura urbana e o cultivo doméstico exigem acompanhamento constante das condições do solo para garantir o desenvolvimento saudável das espécies vegetais. A falta de precisão na irrigação — seja por escassez ou por excesso de água — representa uma das principais causas de perda de cultivos em pequenas hortas.

### 1.2 Objetivos
* **Objetivo Geral:** Desenvolver uma plataforma computacional e de hardware para automatizar o monitoramento do solo e centralizar informações de cultivo botânico.
* **Objetivos Específicos:**
  * Implementar um nó sensor de baixo custo baseado em microcontrolador para medição de umidade do solo;
  * Estruturar um banco de dados relacional para persistência de leituras de telemetria, usuários e catálogo botânico;
  * Desenvolver uma interface web responsiva e instalável (PWA) com painel interativo.

### 1.3 Justificativa
A integração entre IoT e aplicações PWA permite o acesso descentralizado em espaços de tempo, sem a necessidade de instalação via lojas de aplicativos convencionais, reduzindo barreiras de acesso e custos operacionais.

---

## 2 ARQUITETURA DO SISTEMA E TECNOLOGIAS

O sistema adota uma arquitetura em camadas distribuídas, dividida em captura de dados (ponta) e apresentação (cliente):



> #### 📟 1. CAMADA DE CAPTURA | Hardware IoT (Ponta)
> * **Equipamentos:** Arduino Uno R3 + Sensor HD-38
> * **Função:** Mede a umidade do solo e converte a tensão analógica para escala percentual (`0%` a `100%`).

---

> #### ⚡ 2. CAMADA CENTRAL | Supabase (BaaS)
> * **Serviços:** Banco de Dados PostgreSQL | Autenticação JWT | Storage de Mídias
> * **Função:** Armazena o histórico de telemetria, gerencia os usuários e guarda fotos da *Plantopédia*.
> * **Ponto de Integração:** Ponto central de sincronização do sistema.

---

> #### 📱 3. CAMADA DE APRESENTAÇÃO | Frontend PWA (Cliente)
> * **Plataforma:** Progressive Web App (Hospedado via GitHub Pages)
> * **Função:** Tornar fácil a leitura dos dados e visualização das espécies de plantas.


### 2.1 *Progressive Web App* (PWA) e Frontend
A interface com o usuário foi construída utilizando HTML5, CSS3 modularizado e JavaScript. A aplicação segue as diretrizes do PWA, utilizando *Service Workers* e *Web App Manifest* para habilitar capacidades de instalação na tela principal e funcionamento responsivo otimizado para dispositivos móveis (*Mobile-First*).

### 2.2 Backend as a Service (BaaS) — Supabase
O Supabase atua como infraestrutura de backend, fornecendo:
* **Autenticação:** Gestão de acesso baseada em tokens JWT;
* **Database:** Instância PostgreSQL gerenciada;
* **Storage:** Bucket de armazenamento para imagens enviadas no módulo *Plantopédia*.

### 2.3 Hospedagem e Implantação
O código-fonte do cliente web está hospedado na plataforma **GitHub Pages**, garantindo entrega contínua a partir do repositório de versão oficial do projeto.

---

## 3 HARDWARE E TELEMETRIA IOT

### 3.1 Componentes Eletrônicos
O nó de sensoriamento é composto pelos seguintes elementos de hardware:
1. **Placa Microcontroladora:** Arduino Uno R3;
2. **Módulo Condicionador de Sinal:** Placa comparadora HD-38;
3. **Sensor de Umidade do Solo:** Probe de haste dupla resistiva.

### 3.2 Mapeamento de Pinagem e Conexões
A interligação dos componentes no circuito de medição é detalhada na Tabela 1:

**Tabela 1 — Mapeamento de Conexões Eletrônicas**

| Componente Origem (HD-38) | Destino (Arduino Uno) | Função Elétrica |
| :--- | :--- | :--- |
| Pino **VCC** | Pino **5V** | Alimentação do módulo (5V) |
| Pino **GND** | Pino **GND** | Referência de terra comum |
| Pino **AO** (Saída Analógica) | Entrada Analógica **A0** | Leitura de variação de tensão analógica |

### 3.3 Regras de Negócio e Limiares de Umidade
A leitura analógica da porta `A0` do Arduino é processada e convertida na variável percentual `calculaUmidade`, mapeada no intervalo de 0% a 100%. As ações do sistema são pautadas pelos limiares descritos na Tabela 2:

**Tabela 2 — Limiares de Umidade e Interpretador do Sistema**

| Intervalo (`calculaUmidade`) | Classificação do Solo | Ação de Negócio na Interface |
| :--- | :--- | :--- |
| 0% a 16% | Solo Seco / Crítico | Exibição de alerta visual de irrigação urgente |
| 17% a 67% | Umidade Moderada | Condição estável de monitoramento |
| 68% a 83% | Umidade Ideal | Intervalo ótimo de cultivo |
| 84% a 100% | Solo Encharcado / Satisfatório | Suspensão de recomendação de rega |

---

## 4 MODELAGEM E BANCO DE DADOS

### 4.1 Dicionário de Dados

#### Tabela: `cadastro`
Armazena dados estendidos de perfil vinculados à tabela `auth.users` do Supabase.
* `id_conta` (`uuid`, PK, FK): Identificador do usuário.
* `email` (`text`, NOT NULL, UNIQUE): Correio eletrônico do usuário.
* `nivel_acesso` (`text`, DEFAULT `'USER'`): Nível de permissão (`USER`, `ADMIN`).
* `data_criacao` (`date`, DEFAULT `CURRENT_DATE`): Data do cadastro.
* `status` (`boolean`, DEFAULT `true`): Estado da conta.

#### Tabela: `categoria_especimes`
Classificação taxonômica das plantas.
* `id_categoria` (`bigint`, PK, Auto-incremento): Identificador da categoria.
* `nome_categoria` (`text`, NOT NULL, UNIQUE): Nome da categoria.

#### Tabela: `especimes`
Catálogo botânico da *Plantopédia*.
* `id_planta` (`bigint`, PK, Auto-incremento): Identificador da espécie.
* `nome_popular` (`text`, NOT NULL): Nome comum.
* `nome_cientifico` (`text`, NULLABLE): Nomenclatura botânica.
* `informacoes_adicionais` (`text`, NULLABLE): Orientações de cultivo.
* `foto_url` (`text`, NULLABLE): Endereço da imagem no Supabase Storage.
* `id_categoria` (`bigint`, FK): Vínculo com `categoria_especimes`.

#### Tabela: `sensor`
Registro dos dispositivos físicos de medição.
* `id_sensor` (`bigint`, PK, Auto-incremento): Identificador do hardware.
* `nome_sensor` (`text`, NOT NULL): Nome descritivo do dispositivo.

#### Tabela: `horta`
Unidades de cultivo registradas.
* `id_horta` (`bigint`, PK, Auto-incremento): Identificador da horta.
* `nome_horta` (`text`, NOT NULL): Nome atribuído pelo usuário.
* `id_sensor` (`bigint`, FK): Sensor associado à horta.

#### Tabela: `horta_planta`
Tabela associativa para a relação N:M entre `horta` e `especimes`.
* `id_planta` (`bigint`, PK, FK): Código da planta.
* `id_horta` (`bigint`, PK, FK): Código da horta.

#### Tabela: `informacao_sensor`
Histórico de dados de telemetria enviados pelo hardware IoT.
* `id_resposta` (`uuid`, PK, DEFAULT `gen_random_uuid()`): Chave primária da leitura.
* `umidade` (`numeric`): Valor da umidade lido (0 a 100).
* `data_hora` (`timestamptz`, DEFAULT `now()`): Carimbo de data/hora do registro.
* `id_sensor` (`bigint`, FK): Sensor emissor da leitura.

### 4.2 Script de Definição de Dados (DDL)

```sql
CREATE TABLE public.cadastro (
  id_conta uuid NOT NULL,
  email text NOT NULL UNIQUE,
  nivel_acesso text DEFAULT 'USER'::text,
  data_criacao date DEFAULT CURRENT_DATE,
  status boolean DEFAULT true,
  CONSTRAINT cadastro_pkey PRIMARY KEY (id_conta),
  CONSTRAINT cadastro_id_conta_fkey FOREIGN KEY (id_conta) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.sensor (
  id_sensor bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nome_sensor text NOT NULL,
  CONSTRAINT sensor_pkey PRIMARY KEY (id_sensor)
);

CREATE TABLE public.horta (
  id_horta bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nome_horta text NOT NULL,
  id_sensor bigint,
  CONSTRAINT horta_pkey PRIMARY KEY (id_horta),
  CONSTRAINT horta_id_sensor_fkey FOREIGN KEY (id_sensor) REFERENCES public.sensor(id_sensor) ON DELETE SET NULL
);

CREATE TABLE public.categoria_especimes (
  id_categoria bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nome_categoria text NOT NULL UNIQUE,
  CONSTRAINT categoria_especimes_pkey PRIMARY KEY (id_categoria)
);

CREATE TABLE public.especimes (
  id_planta bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nome_popular text NOT NULL,
  nome_cientifico text,
  informacoes_adicionais text,
  foto_url text,
  id_categoria bigint,
  CONSTRAINT especimes_pkey PRIMARY KEY (id_planta),
  CONSTRAINT especimes_id_categoria_fkey FOREIGN KEY (id_categoria) REFERENCES public.categoria_especimes(id_categoria) ON DELETE SET NULL
);

CREATE TABLE public.horta_planta (
  id_planta bigint NOT NULL,
  id_horta bigint NOT NULL,
  CONSTRAINT horta_planta_pkey PRIMARY KEY (id_planta, id_horta),
  CONSTRAINT horta_planta_id_planta_fkey FOREIGN KEY (id_planta) REFERENCES public.especimes(id_planta) ON DELETE CASCADE,
  CONSTRAINT horta_planta_id_horta_fkey FOREIGN KEY (id_horta) REFERENCES public.horta(id_horta) ON DELETE CASCADE
);

CREATE TABLE public.informacao_sensor (
  id_resposta uuid NOT NULL DEFAULT gen_random_uuid(),
  umidade numeric,
  data_hora timestamp with time zone DEFAULT now(),
  id_sensor bigint,
  CONSTRAINT informacao_sensor_pkey PRIMARY KEY (id_resposta),
  CONSTRAINT informacao_sensor_id_sensor_fkey FOREIGN KEY (id_sensor) REFERENCES public.sensor(id_sensor) ON DELETE CASCADE
);

---
```

## 5 ESTRUTURA DO CÓDIGO E MÓDULOS

### 5.1 Organização do Repositório
A arquitetura do repositório é organizada no padrão de separação clara entre a aplicação cliente (*frontend*) e o sistema embarcado (*hardware*):

```text
Projeto_AHMA/
├── Client/
│   ├── assets/
│   │   ├── css/
│   │   │   ├── base/
│   │   │   ├── components/
│   │   │   └── pages/
│   │   ├── icons/
│   │   └── images/
│   ├── monitoramento/
│   └── src/
│       ├── auth/
│       ├── components/
│       ├── config/
│       ├── pages/
│       └── services/
└── IoT/

```
### 5.2 Funcionalidades dos Módulos

> #### 🔐 Módulo `Client/src/auth`
> Gerencia a autenticação de usuários, desde a criação de conta e controle de acesso até a persistência do token de sessão via **Supabase Auth**.

> #### 🌿 Módulo `Client/src/pages/Plantopédia`
> Interface para gerenciamento (CRUD) do catálogo botânico, integrada ao **Supabase Storage** para upload e renderização de imagens das espécies.

> #### 📊 Módulo `Client/monitoramento`
> Painel de controle (*Dashboard*) com gráficos de séries temporais gerados a partir dos registros de umidade gravados na tabela `informacao_sensor`.

> #### 📟 Módulo `IoT`
> Código em C/C++ (sketch `.ino`) compilado no Arduino Uno, responsável pela amostragem do pino analógico `A0` e transmissão das métricas de telemetria.

---

## 6 CONCLUSÃO

O **Projeto AHMA** cumpre os requisitos propostos para o monitoramento contínuo de hortas urbanas, unindo de forma eficiente *hardware livre* (Arduino) a tecnologias modernas de desenvolvimento web (**PWA** e BaaS **Supabase**).

A conversão dos dados brutos do sensor em faixas percentuais bem definidas proporciona uma tomada de decisão rápida e assertiva para o usuário final no manejo da irrigação.

---

## 7 REFERÊNCIAS

* **ARDUINO**. *Arduino Uno Rev3 Documentation*. Disponível em: <https://docs.arduino.cc/hardware/uno-rev3/>. Acesso em: 21 set. 2026.
* **ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS**. *NBR 14724: Informação e documentação — Trabalhos acadêmicos — Apresentação*. Rio de Janeiro: ABNT, 2011.
* **SUPABASE**. *Supabase Documentation: Database, Auth and Storage*. Disponível em: <https://supabase.com/docs>. Acesso em: 21 set. 2026.