# 🔧 GearFlow

**Sistema de Gerenciamento de Oficina Mecânica**

Projeto acadêmico desenvolvido para a disciplina de **Programação
Orientada a Objetos II (POO II)**, do curso de Engenharia de Software da
**Universidade Tecnológica Federal do Paraná (UTFPR) --- Campus Cornélio
Procópio**.

> 🚧 **Status:** Em desenvolvimento. As funcionalidades recentes estão
> em fase de integração e validação. O projeto é acadêmico e não está
> preparado para produção.

------------------------------------------------------------------------

## 📖 Sobre o Projeto

O **GearFlow** é um sistema voltado ao gerenciamento de oficinas
mecânicas, com o objetivo de centralizar informações e facilitar a
organização dos processos internos.

A proposta contempla o gerenciamento de clientes, veículos,
funcionários, peças, serviços e ordens de serviço, proporcionando maior
controle sobre os atendimentos realizados.

O desenvolvimento utiliza conceitos de **Programação Orientada a
Objetos**, arquitetura em camadas, persistência de dados e
desenvolvimento de APIs REST.

## 🎯 Objetivos

-   Organizar o gerenciamento de uma oficina mecânica.
-   Centralizar informações de clientes e veículos.
-   Facilitar o controle de ordens de serviço.
-   Permitir o acompanhamento dos serviços pelos clientes.
-   Aplicar conceitos de orientação a objetos e persistência de dados.
-   Desenvolver uma aplicação modular e de fácil manutenção.

------------------------------------------------------------------------

## 🛠️ Tecnologias Utilizadas

  -----------------------------------------------------------------------
  Tecnologia                          Finalidade
  ----------------------------------- -----------------------------------
  Java 25 e Spring Boot 4.1.1         Backend (versões informadas no
                                      README anterior; confirmar em
                                      `pom.xml`)

  Spring Web MVC, Spring Data JPA e   API REST e persistência
  Hibernate

  Spring Security                     Autenticação e autorização

  MySQL                               Banco de dados

  React, Vite e React Router          Interface web e navegação

  CSS e Lucide React                  Estilização e ícones

  Three.js, React Three Fiber e Drei  Inspeção 3D

  Maven Wrapper e npm                 Dependências e execução

  Lombok, JUnit 5 e Mockito           Apoio ao desenvolvimento e testes

  Postman, Git e GitHub               Testes manuais e colaboração
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 📋 Funcionalidades

O projeto reúne módulos para três perfis: **cliente**, **funcionário** e
**gerente**.

### Gestão administrativa e operacional

-   Gestão de clientes: pesquisa, cadastro, edição e exclusão, com
    autorização de gerente.
-   Gestão de equipe, veículos, peças, estoque e catálogo de serviços.
-   Gestão de ordens de serviço e **RF05 --- Fila de prioridade**.
-   **RF09 --- Fechamento de rascunho**.
-   Dashboard geral e financeiro, com indicadores e atalhos de
    navegação.
-   Gestão de agendamentos.

### Portal do cliente

-   Login, cadastro e recuperação da sessão autenticada.
-   Dashboard com veículos, ordens de serviço e agendamentos.
-   **RF12 --- Acompanhamento de OS** e **RF13 --- Visualização de
    orçamento**.
-   **RF14 --- Aprovação ou rejeição de orçamento**.
-   **RF21 --- Alertas de manutenção preventiva**.
-   Inspeção 3D e informações de diagnóstico vinculadas ao atendimento.

### Regras e qualidade

-   **RF15 --- Imutabilidade de OS finalizada**.
-   Regras de permissão conforme o perfil do usuário.

> As telas e implementações recentes foram desenvolvidas, mas ainda
> precisam de validação integrada de todos os fluxos e perfis antes de
> serem consideradas uma versão estável.

------------------------------------------------------------------------

## 🏗️ Estrutura do Projeto

``` text
GearFlow/
├── README.md
├── gearflow-frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── App.jsx
│       └── main.jsx
└── gearflow-system/
    ├── pom.xml
    ├── mvnw
    ├── mvnw.cmd
    └── src/
        ├── main/
        │   ├── java/com/gearflow/gearflow_system/
        │   │   ├── Configs/
        │   │   ├── Controllers/
        │   │   ├── DTOs/
        │   │   ├── Models/
        │   │   ├── Repositories/
        │   │   └── Services/
        │   └── resources/application.yml
        └── test/
```

### Organização das Camadas

-   **Model:** entidades e regras de negócio.
-   **Repository:** comunicação com o banco de dados.
-   **Service:** processamento e validação das regras de negócio.
-   **Controller:** recebimento e tratamento das requisições HTTP.
-   **DTO:** transferência de dados entre a aplicação e seus
    consumidores.
-   **Config:** configurações da aplicação, incluindo segurança.

------------------------------------------------------------------------

## 🚀 Como Executar o Projeto

### Pré-requisitos

-   Git, MySQL e JDK compatível com `gearflow-system/pom.xml` (o README
    anterior indicava Java 25).
-   Node.js e npm compatíveis com `gearflow-frontend/package.json`.
-   IDE de preferência.

O Maven Wrapper já está incluído no repositório.

### 1. Clonar o repositório

``` bash
git clone https://github.com/GabrielCotrimMiron/GearFlow.git
cd GearFlow
```

### 2. Configurar o banco

No MySQL:

``` sql
CREATE DATABASE IF NOT EXISTS gearflow;
```

Verifique `gearflow-system/src/main/resources/application.yml`. Exemplo
da configuração usada no desenvolvimento:

``` yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/gearflow
    username: root
    password: ${DB_PASSWORD}
```

Defina a variável `DB_PASSWORD` no terminal em que iniciará o backend:

Git Bash:

``` bash
export DB_PASSWORD='SUA_SENHA_LOCAL'
```

PowerShell:

``` powershell
$env:DB_PASSWORD = 'SUA_SENHA_LOCAL'
```

**Nunca publique senhas reais no GitHub.** O banco e seus registros não
são transferidos pelo Git.

### 3. Executar o backend

No Git Bash:

``` bash
cd gearflow-system
./mvnw spring-boot:run
```

No PowerShell, dentro de `gearflow-system`:

``` powershell
.\mvnw.cmd spring-boot:run
```

API esperada: `http://localhost:8080`.

### 4. Executar o frontend

Em outro terminal, a partir da raiz `GearFlow`:

``` bash
cd gearflow-frontend
npm install
npm run dev
```

Abra o endereço informado pelo Vite (normalmente
`http://localhost:5173`).

Se a comunicação com a API falhar, confira o backend, `vite.config.js` e
`src/services/api.js`.

### 5. Acesso e contas de teste

Utilize usuários existentes no MySQL local ou cadastre um cliente pelo
sistema. Não há logins e senhas universais documentados. As permissões
devem ser verificadas com contas de **cliente**, **funcionário** e
**gerente**.

------------------------------------------------------------------------

## 🌐 Endpoints da API

  Método   Endpoint                                Finalidade
  -------- --------------------------------------- -------------------------------------
  POST     `/auth/login`                           Login
  GET      `/auth/session`                         Consultar sessão
  POST     `/auth/logout`                          Encerrar sessão
  GET      `/admin/clientes`                       Listagem administrativa de clientes
  GET      `/ordens-servico/minhas`                OS do cliente autenticado
  GET      `/ordens-servico/{id}/acompanhamento`   Acompanhamento
  GET      `/ordens-servico/{id}/orcamento`        Orçamento
  GET      `/ordens-servico/fila-prioridade`       Fila de prioridade
  PUT      `/ordens-servico/{id}/prioridade`       Alterar prioridade

A tabela resume algumas rotas; os contratos completos estão nos
Controllers e DTOs.

------------------------------------------------------------------------

## 🧪 Testes Automatizados

O projeto utiliza **JUnit 5** e **Mockito** para validar regras de
negócio.

Para executar os testes do backend, a partir da pasta `gearflow-system`:

``` bash
./mvnw test
```

No PowerShell do Windows, utilize `.\\mvnw.cmd test` (sem os espaços
externos).

> Os testes de inicialização da aplicação dependem da disponibilidade do
> MySQL e da configuração correta da variável `DB_PASSWORD`.

### Cenários documentados anteriormente

**RF12 --- Acompanhamento da OS**

-   Consulta de ordem pertencente ao cliente autenticado.
-   Bloqueio de acesso a ordens de outros clientes.
-   Tratamento de ordens de serviço inexistentes.

**RF15 --- Imutabilidade da OS**

-   Bloqueio de alterações após finalização.
-   Bloqueio da adição de itens em ordens finalizadas.
-   Permissão de alterações em ordens em execução.
-   Bloqueio de alterações no preço de itens após finalização.

### Build do frontend

Na pasta `gearflow-frontend`:

``` bash
npm run build
```

Além do build, teste o login e logout, permissões, CRUD de clientes,
orçamento, agendamentos, alertas preventivos e inspeção 3D.

### Validação pelo Postman

Durante o desenvolvimento, também foram realizados testes manuais dos
endpoints.

  -----------------------------------------------------------------------
  Funcionalidade          Cenário                 Resultado
  ----------------------- ----------------------- -----------------------
  RF12                    Cliente consulta sua    200 OK
                          própria OS

  RF12                    Consulta sem            401 Unauthorized
                          autenticação

  RF12                    Consulta de OS de outro 403 Forbidden
                          cliente

  RF12                    Consulta de OS          404 Not Found
                          inexistente

  RF01                    Login administrativo    200 OK
                          válido

  RF01                    Cliente tenta realizar  401 Unauthorized
                          login administrativo
  -----------------------------------------------------------------------

Os cenários acima foram registrados no README anterior; execute os
testes novamente na branch atual antes de declarar a integração
validada.

------------------------------------------------------------------------

## 🔐 Segurança

O GearFlow utiliza Spring Security e autenticação por sessão HTTP, além
de verificações de autorização em rotas específicas.

**Limitações conhecidas no ambiente de desenvolvimento:** - Uso
temporário de `NoOpPasswordEncoder` e senhas sem hash. - Regras
permissivas para rotas não explicitamente protegidas. - Proteção CSRF
desabilitada apesar do uso de sessão por cookie. - Necessidade de
revisão completa de permissões, validação e tratamento de dados
pessoais.

**Esta aplicação acadêmica não está pronta para produção.** Antes de uma
implantação real, é necessário usar hash seguro de senhas, proteção CSRF
compatível com sessão e revisar todas as regras de autorização no
backend.

------------------------------------------------------------------------

## 🤝 Como o outro desenvolvedor atualiza o projeto

**Não é necessário baixar os ZIPs usados durante o desenvolvimento.**
Depois que um Pull Request for integrado à `main`, o Otávio pode
atualizar o código com:

``` bash
git switch main
git pull origin main
```

Na pasta `gearflow-frontend`, execute `npm install` para instalar novas
dependências. O Maven Wrapper cuida das dependências do backend.

O **MySQL e as variáveis de ambiente** precisam ser configurados em cada
computador. O Git não transfere dados de bancos locais. Se houver
alterações não commitadas, organize-as antes de trocar de branch.

------------------------------------------------------------------------

## 🔄 Versionamento e Colaboração

O projeto utiliza Git e GitHub para controle de versões e
desenvolvimento colaborativo.

As funcionalidades são desenvolvidas em branches específicas, permitindo
que as implementações sejam revisadas antes da integração à branch
principal.

Fluxo de desenvolvimento:

1.  Criação de uma branch para a funcionalidade.
2.  Implementação dos requisitos.
3.  Execução dos testes automatizados.
4.  Validação dos endpoints.
5.  Criação de commits.
6.  Abertura de Pull Request.
7.  Revisão e integração à branch `main`.

------------------------------------------------------------------------

## 👨‍💻 Desenvolvedores

**Gabriel Cotrim Miron**\
Engenharia de Software --- UTFPR\
[GitHub](https://github.com/GabrielCotrimMiron)

**Otávio Felício**\
Engenharia de Software --- UTFPR
[GitHub](https://github.com/tatofelicio)

------------------------------------------------------------------------

## 🎓 Contexto Acadêmico

**Instituição:** Universidade Tecnológica Federal do Paraná (UTFPR)\
**Campus:** Cornélio Procópio\
**Curso:** Bacharelado em Engenharia de Software\
**Disciplina:** Programação Orientada a Objetos II

------------------------------------------------------------------------

**GearFlow --- Sistema de Gerenciamento de Oficina Mecânica**

*Projeto acadêmico em desenvolvimento.*
