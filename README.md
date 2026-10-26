
# 🔧 GearFlow

**Sistema de Gerenciamento de Oficina Mecânica**

Projeto acadêmico desenvolvido para a disciplina de **Programação Orientada a Objetos II (POO II)**, do curso de Engenharia de Software da **Universidade Tecnológica Federal do Paraná (UTFPR) — Campus Cornélio Procópio**.

> 🚧 **Status:** Em desenvolvimento. O sistema está sendo implementado gradualmente, conforme os requisitos funcionais definidos para o projeto.

---

## 📖 Sobre o Projeto

O **GearFlow** é um sistema voltado ao gerenciamento de oficinas mecânicas, com o objetivo de centralizar informações e facilitar a organização dos processos internos.

A proposta contempla o gerenciamento de clientes, veículos, funcionários, peças, serviços e ordens de serviço, proporcionando maior controle sobre os atendimentos realizados.

O desenvolvimento utiliza conceitos de **Programação Orientada a Objetos**, arquitetura em camadas, persistência de dados e desenvolvimento de APIs REST.

## 🎯 Objetivos

- Organizar o gerenciamento de uma oficina mecânica.
- Centralizar informações de clientes e veículos.
- Facilitar o controle de ordens de serviço.
- Permitir o acompanhamento dos serviços pelos clientes.
- Aplicar conceitos de orientação a objetos e persistência de dados.
- Desenvolver uma aplicação modular e de fácil manutenção.

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Finalidade |
|---|---|
| Java 25 | Linguagem principal |
| Spring Boot 4.1.1 | Framework de desenvolvimento |
| Spring Web MVC | Desenvolvimento da API REST |
| Spring Data JPA | Persistência de dados |
| Hibernate | Mapeamento objeto-relacional |
| Spring Security | Autenticação e controle de acesso |
| MySQL | Banco de dados relacional |
| Maven | Gerenciamento de dependências |
| Lombok | Redução de código repetitivo |
| JUnit 5 | Testes automatizados |
| Mockito | Simulação de dependências nos testes |
| Postman | Testes de requisições HTTP |
| Git e GitHub | Versionamento e colaboração |

---

## 📋 Funcionalidades

### ✅ Implementadas e Validadas

**RF01 — Login Administrativo**

- Autenticação por e-mail e senha.
- Verificação das credenciais no banco de dados.
- Restrição de acesso administrativo a usuários do tipo funcionário.
- Retorno de respostas HTTP adequadas para autenticação válida e inválida.

**RF12 — Acompanhamento da Ordem de Serviço**

- Consulta de ordens de serviço por clientes autenticados.
- Visualização do status operacional da OS.
- Identificação do mecânico responsável.
- Verificação de propriedade da ordem de serviço.
- Bloqueio de consultas realizadas por clientes não autorizados.

**RF15 — Imutabilidade de Ordem de Serviço Finalizada**

- Bloqueio de alterações em ordens de serviço finalizadas.
- Impedimento da inclusão de novos itens após a finalização.
- Proteção contra alterações de valores de itens vinculados.
- Testes automatizados das regras de imutabilidade.

### 🚧 Funcionalidades Planejadas

O escopo do projeto também contempla:

- Gerenciamento de clientes e veículos.
- Cadastro de funcionários.
- Gerenciamento de peças e serviços.
- Controle de ordens de serviço.
- Gerenciamento de estoque.
- Histórico de manutenções.
- Orçamentos e pagamentos.

> As funcionalidades planejadas serão atualizadas nesta documentação conforme forem implementadas e validadas.

---

## 🏗️ Estrutura do Projeto

O backend está organizado em camadas para separar responsabilidades e facilitar a manutenção.

```text
GearFlow/
│
├── README.md
│
└── gearflow-system/
    │
    ├── pom.xml
    ├── mvnw
    ├── mvnw.cmd
    │
    └── src/
        ├── main/
        │   ├── java/com/gearflow/gearflow_system/
        │   │   ├── config/
        │   │   ├── controller/
        │   │   ├── dto/
        │   │   ├── model/
        │   │   ├── repository/
        │   │   └── service/
        │   │
        │   └── resources/
        │       └── application.yml
        │
        └── test/
            └── java/com/gearflow/gearflow_system/
```

### Organização das Camadas

- **Model:** entidades e regras de negócio.
- **Repository:** comunicação com o banco de dados.
- **Service:** processamento e validação das regras de negócio.
- **Controller:** recebimento e tratamento das requisições HTTP.
- **DTO:** transferência de dados entre a aplicação e seus consumidores.
- **Config:** configurações da aplicação, incluindo segurança.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos

- Java 25
- MySQL
- Git
- IDE de sua preferência (IntelliJ IDEA, Eclipse ou VS Code)

O projeto utiliza Maven Wrapper, portanto não é necessário instalar o Maven separadamente.

### 1. Clonar o Repositório

```bash
git clone https://github.com/GabrielCotrimMiron/GearFlow.git
```

Entre no diretório da aplicação:

```bash
cd GearFlow/gearflow-system
```

### 2. Configurar o Banco de Dados

No MySQL, crie o banco:

```sql
CREATE DATABASE IF NOT EXISTS gearflow;
```

A configuração utilizada no desenvolvimento é:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/gearflow
    username: root
    password: ${DB_PASSWORD}
```

A senha é obtida por meio da variável de ambiente `DB_PASSWORD`.

No Git Bash:

```bash
export DB_PASSWORD='SUA_SENHA_DO_MYSQL'
```

> ⚠️ Não inclua senhas reais ou outras informações sensíveis no repositório.

### 3. Executar a Aplicação

No Windows, utilizando Git Bash:

```bash
./mvnw.cmd spring-boot:run
```

A aplicação será iniciada, por padrão, em:

```text
http://localhost:8080
```

---

## 🌐 Endpoints da API

### RF01 — Login Administrativo

**Endpoint:**

```http
POST /auth/login
```

**Exemplo de requisição:**

```json
{
  "email": "admin@exemplo.com",
  "senha": "senha_exemplo"
}
```

**Possíveis respostas:**

| Código | Significado |
|---|---|
| 200 OK | Credenciais aceitas |
| 401 Unauthorized | Credenciais inválidas ou usuário não autorizado |

A autenticação administrativa atual verifica as credenciais de usuários do tipo funcionário.

### RF12 — Acompanhamento da Ordem de Serviço

**Endpoint:**

```http
GET /ordens-servico/{id}/acompanhamento
```

**Autenticação:** HTTP Basic Auth.

O cliente deve informar seu e-mail e senha cadastrados.

**Exemplo de resposta:**

```json
{
  "ordemServicoId": 3,
  "status": "EM_EXECUCAO",
  "mecanicoResponsavel": "Nao atribuido"
}
```

**Possíveis respostas:**

| Código | Significado |
|---|---|
| 200 OK | Consulta realizada com sucesso |
| 401 Unauthorized | Usuário não autenticado |
| 403 Forbidden | Ordem pertencente a outro cliente |
| 404 Not Found | Ordem de serviço inexistente |

O sistema verifica se o veículo associado à ordem de serviço pertence ao cliente autenticado.

---

## 🧪 Testes Automatizados

O projeto utiliza **JUnit 5** e **Mockito** para validar regras de negócio.

Para executar todos os testes:

```bash
./mvnw.cmd clean test
```

> Os testes de inicialização da aplicação dependem da disponibilidade do MySQL e da configuração correta da variável `DB_PASSWORD`.

### Cenários Testados

**RF12 — Acompanhamento da OS**

- Consulta de ordem pertencente ao cliente autenticado.
- Bloqueio de acesso a ordens de outros clientes.
- Tratamento de ordens de serviço inexistentes.

**RF15 — Imutabilidade da OS**

- Bloqueio de alterações após finalização.
- Bloqueio da adição de itens em ordens finalizadas.
- Permissão de alterações em ordens em execução.
- Bloqueio de alterações no preço de itens após finalização.

### Validação pelo Postman

Durante o desenvolvimento, também foram realizados testes manuais dos endpoints.

| Funcionalidade | Cenário | Resultado |
|---|---|---|
| RF12 | Cliente consulta sua própria OS | 200 OK |
| RF12 | Consulta sem autenticação | 401 Unauthorized |
| RF12 | Consulta de OS de outro cliente | 403 Forbidden |
| RF12 | Consulta de OS inexistente | 404 Not Found |
| RF01 | Login administrativo válido | 200 OK |
| RF01 | Cliente tenta realizar login administrativo | 401 Unauthorized |

Os cenários acima foram validados durante o desenvolvimento.

---

## 🔐 Segurança

O GearFlow utiliza Spring Security para autenticação HTTP Basic no endpoint de acompanhamento de ordens de serviço.

A aplicação ainda está em desenvolvimento e possui limitações de segurança, incluindo:

- Utilização de senhas em texto puro.
- Uso temporário de `NoOpPasswordEncoder`.
- Configuração de acesso permissiva para outras rotas.
- Ausência de uma solução completa de autenticação por sessão ou token.

Esses aspectos deverão ser aprimorados em versões futuras.

> ⚠️ Esta versão é destinada ao ambiente acadêmico e de desenvolvimento, não sendo adequada para implantação em produção sem melhorias de segurança.

---

## 🔄 Versionamento e Colaboração

O projeto utiliza Git e GitHub para controle de versões e desenvolvimento colaborativo.

As funcionalidades são desenvolvidas em branches específicas, permitindo que as implementações sejam revisadas antes da integração à branch principal.

Fluxo de desenvolvimento:

1. Criação de uma branch para a funcionalidade.
2. Implementação dos requisitos.
3. Execução dos testes automatizados.
4. Validação dos endpoints.
5. Criação de commits.
6. Abertura de Pull Request.
7. Revisão e integração à branch `main`.

---

## 👨‍💻 Desenvolvedores

**Gabriel Cotrim Miron**  
Engenharia de Software — UTFPR  
[GitHub](https://github.com/GabrielCotrimMiron)

**Otávio Felício**  
Engenharia de Software — UTFPR
[GitHub](https://github.com/tatofelicio)

---

## 🎓 Contexto Acadêmico

**Instituição:** Universidade Tecnológica Federal do Paraná (UTFPR)  
**Campus:** Cornélio Procópio  
**Curso:** Bacharelado em Engenharia de Software  
**Disciplina:** Programação Orientada a Objetos II

---

**GearFlow — Sistema de Gerenciamento de Oficina Mecânica**

*Projeto acadêmico em desenvolvimento.*
