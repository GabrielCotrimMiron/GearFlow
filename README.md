# 🔧 GearFlow

**Sistema Web de Gerenciamento de Oficina Mecânica**

Projeto acadêmico desenvolvido por **Gabriel Cotrim Miron** e **Otávio Felício**, na disciplina de **Programação Orientada a Objetos II (POO II)**, do Bacharelado em Engenharia de Software da **UTFPR — Campus Cornélio Procópio**.

> **Status (12/11/2026):** implementação acadêmica em revisão final. O código inclui frontend, backend, persistência e regras de negócio. Ainda é necessária a validação integrada após a atualização antes de apresentá-lo como uma versão estável.

## Sobre o projeto

O GearFlow organiza atividades de uma oficina mecânica e oferece áreas separadas para **gerente**, **funcionário/mecânico** e **cliente**. O cliente acompanha serviços e orçamentos; a oficina mantém veículos, equipe, estoque, agendamentos e ordens de serviço.

### Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Backend | **Java 25**, **Spring Boot 4.1.1**, Spring MVC, Spring Data JPA, Hibernate, Spring Security |
| Banco | MySQL |
| Frontend | React 19, Vite 8, React Router, CSS, Axios |
| Visualização 3D | Three.js, React Three Fiber, Drei |
| Build/testes | Maven Wrapper, npm, JUnit 5, Mockito |
| Colaboração | Git e GitHub |

As versões exatas das dependências estão em `gearflow-system/pom.xml` e `gearflow-frontend/package.json`.

## Funcionalidades

| Módulo | Recursos principais |
| --- | --- |
| Autenticação | Login local com sessão HTTP, cadastro de clientes e logout |
| Gestão de clientes | Listar, pesquisar, cadastrar, editar e excluir, com acesso restrito ao gerente |
| Equipe | Cadastro, edição, consulta e exclusão de funcionários |
| Veículos | Cadastro, vínculo com cliente e histórico de manutenção |
| Peças e serviços | Catálogos, estoque e preços |
| Ordens de serviço | Abertura, itens, diagnóstico, status, prioridades e fechamento |
| RF05 | Fila de OS ordenada por prioridade (urgente, alta, normal) |
| RF09 | Fechamento do orçamento em rascunho |
| RF12/RF13 | Acompanhamento da OS e consulta de orçamento pelo cliente |
| RF14 | Aprovação ou rejeição de orçamento |
| RF15 | Bloqueio de alterações em OS finalizada |
| RF21 | Alertas de manutenção preventiva por quilometragem |
| Agendamentos | Solicitação, horários disponíveis, aprovação e cancelamento |
| Inspeção 3D | Diagnóstico visual e apontamentos associados à OS |
| Dashboards | Área do cliente, painel gerencial e financeiro |

**Fluxo geral da OS:** `EM_ANALISE` → `AGUARDANDO_APROVACAO` → `EM_EXECUCAO` (se o cliente aprovar) → `FINALIZADA`. Se rejeitada, passa para `ORCAMENTO_REJEITADO`. Ao finalizar, o pagamento fica `PENDENTE` para posterior registro pela oficina.

> Os módulos estão implementados no código; a revisão funcional depende de executar os cenários de teste com MySQL e perfis reais. Não presuma que todos os fluxos foram validados apenas porque o build passou.

## Estrutura do projeto

```text
GearFlow/
├── README.md
├── gearflow-frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
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
        ├── main/java/com/gearflow/gearflow_system/
        │   ├── Configs/
        │   ├── Controllers/
        │   ├── DTOs/
        │   ├── Models/
        │   ├── Repositories/
        │   └── Services/
        ├── main/resources/application.yml
        └── test/
```

### Organização do backend

- **Models:** entidades JPA e regras básicas de negócio.
- **Repositories:** consultas ao banco com Spring Data JPA.
- **Services:** regras e validações usadas pelas funcionalidades.
- **Controllers:** endpoints HTTP chamados pelo frontend.
- **DTOs:** objetos de entrada e saída da API.
- **Configs:** configuração de segurança e dados de demonstração.

## Como executar localmente

### Pré-requisitos

- JDK **25**, compatível com o `pom.xml`.
- MySQL iniciado localmente.
- Node.js e npm compatíveis com o Vite 8.
- Git e uma IDE (VS Code/IntelliJ/Eclipse).

### 1. Clonar

```bash
git clone https://github.com/GabrielCotrimMiron/GearFlow.git
cd GearFlow
```

### 2. Criar o banco

Execute no MySQL:

```sql
CREATE DATABASE IF NOT EXISTS gearflow;
```

A configuração de desenvolvimento usa `jdbc:mysql://localhost:3306/gearflow`, usuário `root` e senha recebida pela variável `DB_PASSWORD`. Ajuste localmente se o seu MySQL for diferente.

### 3. Executar o backend

**Git Bash, na raiz do GearFlow:**

```bash
cd gearflow-system
export DB_PASSWORD='SENHA_DO_SEU_MYSQL'
./mvnw spring-boot:run
```

**PowerShell (alternativa):**

```powershell
cd gearflow-system
$env:DB_PASSWORD = 'SENHA_DO_SEU_MYSQL'
.\mvnw.cmd spring-boot:run
```

API esperada: **http://localhost:8080**. O MySQL precisa estar ativo.

### 4. Executar o frontend

Em **outro terminal**, a partir da pasta `GearFlow`:

```bash
cd gearflow-frontend
npm install
npm run dev
```

Abra o endereço mostrado pelo Vite, geralmente **http://localhost:5173**. O frontend utiliza o proxy `/api` para encaminhar as chamadas ao backend local.

### 5. Conta inicial de demonstração (somente para banco novo)

A revisão **não cria mais uma conta de gerente com senha fixa publicada no código**. Se for necessário criar a conta de teste `admin@gearflow.com` em um banco sem gerente, defina **antes de iniciar o backend**:

```bash
export GEARFLOW_DEMO_ADMIN_PASSWORD='ESCOLHA_UMA_SENHA_DE_TESTE'
```

Em PowerShell:

```powershell
$env:GEARFLOW_DEMO_ADMIN_PASSWORD = 'ESCOLHA_UMA_SENHA_DE_TESTE'
```

O administrador é criado apenas se a variável estiver definida **e** o e-mail ainda não existir. Contas existentes não são alteradas. Guarde a senha fora do repositório. **Os usuários e registros do MySQL não são transferidos pelo `git pull`**.

## Login e permissões

O sistema utiliza a autenticação do Spring Security com **sessão HTTP**. Após o login, o navegador mantém o cookie da sessão e o frontend consulta `GET /auth/session` para restaurar o usuário após atualizar a página. O e-mail, o nome e o perfil são retornados sem informar a senha.

| Perfil | Permissões previstas |
| --- | --- |
| Cliente (`USER`) | Próprios veículos, OS, orçamentos, agendamentos, alertas e inspeções permitidas |
| Mecânico (`FUNCIONARIO`) | Operações de oficina, estoque, serviços, ordens e financeiro |
| Gerente (`FUNCIONARIO` + `GERENTE`) | Operações internas **e** administração de clientes/equipe |

As permissões são verificadas no backend. O frontend também protege as rotas internas, mas isso **não substitui** a proteção da API.

## Exemplos de endpoints

| Método | Rota | Operação |
| --- | --- | --- |
| `POST` | `/auth/login` | Entrar |
| `GET` | `/auth/session` | Consultar sessão |
| `POST` | `/auth/logout` | Encerrar sessão |
| `POST` | `/clientes/registro` | Cadastrar cliente |
| `GET` | `/admin/clientes` | Gestão de clientes (gerente) |
| `GET` | `/veiculos/meus` | Veículos do cliente |
| `GET` | `/veiculos/{id}/historico` | Histórico autorizado |
| `GET` | `/ordens-servico/minhas` | Ordens do cliente |
| `GET` | `/ordens-servico/{id}/orcamento` | Consultar orçamento |
| `PUT` | `/ordens-servico/{id}/aprovar` | Aprovar orçamento |
| `PUT` | `/ordens-servico/{id}/rejeitar` | Rejeitar orçamento |
| `GET` | `/ordens-servico/fila-prioridade` | RF05: fila priorizada |
| `PUT` | `/ordens-servico/{id}/finalizar` | Finalizar OS em execução |
| `GET` | `/alertas-preventivos/meus` | Alertas do cliente |

Consulte os Controllers e DTOs para métodos e formatos restantes.

## Testes e checklist de entrega

**Backend** (pasta `gearflow-system`):

```bash
./mvnw test
```

**Frontend** (pasta `gearflow-frontend`):

```bash
npm run build
```

Antes de entregar, teste manualmente pelo menos:

1. Entrar, atualizar a página e sair em cada perfil.
2. Cadastro de cliente e funcionário, incluindo senha e CPF.
3. Restrição de `/admin/clientes` para usuário que não é gerente.
4. Bloqueio de histórico de veículo de outra conta.
5. Agendamento, aprovação e vínculo com OS.
6. Inclusão de peça, desconto, aprovação/rejeição, finalização e pagamento.
7. Ordem urgente acima da normal, alertas preventivos e Inspeção 3D.

Uma classe adicional de testes (`RevisaoFinalTest.java`) verifica regressões encontradas na revisão. **Os testes precisam ser executados em ambiente com Java 25 e dependências Maven disponíveis.**

## Segurança e limites do projeto acadêmico

O GearFlow é **um protótipo local, não adequado para produção**. Apesar dos controles de acesso revisados, ainda usa `NoOpPasswordEncoder` (senhas sem hash), CSRF desabilitado e não possui infraestrutura de hospedagem com HTTPS, monitoramento ou migrações de banco versionadas.

Antes de publicar na internet, será necessário migrar senhas com cuidado, habilitar uma proteção CSRF compatível com sessões, revisar validações e tratar dados pessoais com segurança. **Não use dados pessoais reais na demonstração.**

## Versionamento e colaboração

As alterações devem ser feitas em branches e integradas via Pull Request. Após o merge na `main`, o outro desenvolvedor executa:

```bash
git switch main
git pull origin main
cd gearflow-frontend
npm install
```

O GitHub compartilha o **código**, não os arquivos ZIP utilizados na instalação nem o banco MySQL local. Caso existam alterações locais não commitadas, organize-as antes do `git switch`.

## Desenvolvedores

**Gabriel Cotrim Miron** — [GitHub](https://github.com/GabrielCotrimMiron)
**Otávio Felício** — [GitHub](https://github.com/tatofelicio)

**UTFPR — Campus Cornélio Procópio | Engenharia de Software | POO II**
