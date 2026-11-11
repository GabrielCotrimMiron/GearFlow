import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../services/api";
import "./GestaoEquipe.css";

const FORMULARIO_VAZIO = {
  nome: "",
  email: "",
  senha: "",
  cpf: "",
  nivelAcesso: "MECANICO",
};

function formatarCargo(cargo) {
  const cargos = {
    MECANICO: "Mecânico",
    GERENTE: "Gerente",
  };

  return cargos[cargo] || cargo || "Não informado";
}

function obterIniciais(nome) {
  if (!nome) return "?";

  const partes = nome.trim().split(/\s+/);

  if (partes.length === 1) {
    return partes[0].charAt(0).toUpperCase();
  }

  return (
    partes[0].charAt(0) + partes[partes.length - 1].charAt(0)
  ).toUpperCase();
}

export default function Equipe() {
  const [equipe, setEquipe] = useState([]);
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroCargo, setFiltroCargo] = useState("TODOS");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [funcionarioEmEdicao, setFuncionarioEmEdicao] = useState(null);
  const [funcionarioDetalhe, setFuncionarioDetalhe] = useState(null);
  const [formData, setFormData] = useState(FORMULARIO_VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    let ativo = true;

    async function buscarEquipe() {
      try {
        const response = await api.get("/funcionarios");
        const lista = Array.isArray(response.data)
          ? response.data
          : response.data?.content || [];

        if (ativo) setEquipe(lista);
      } catch (error) {
        console.error(error);
        if (ativo) {
          setErro("Não foi possível carregar os funcionários.");
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    buscarEquipe();

    return () => {
      ativo = false;
    };
  }, []);

  async function carregarEquipe() {
    const response = await api.get("/funcionarios");
    const lista = Array.isArray(response.data)
      ? response.data
      : response.data?.content || [];

    setEquipe(lista);
  }

  function handleChange(evento) {
    const { name, value } = evento.target;

    setFormData((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  function abrirModalNovo() {
    setFuncionarioEmEdicao(null);
    setFormData({ ...FORMULARIO_VAZIO });
    setErro("");
    setIsModalOpen(true);
  }

  function abrirModalEdicao(funcionario) {
    setFuncionarioEmEdicao(funcionario);
    setFormData({
      nome: funcionario.nome || "",
      email: funcionario.email || "",
      senha: "",
      cpf: funcionario.cpf || "",
      nivelAcesso: funcionario.nivelAcesso || "MECANICO",
    });
    setErro("");
    setIsModalOpen(true);
  }

  async function handleExcluir(id) {
    const confirmado = window.confirm(
      "Deseja realmente excluir este funcionário da equipe?",
    );

    if (!confirmado) return;

    setErro("");
    setMensagem("");

    try {
      await api.delete(`/funcionarios/${id}`);
      await carregarEquipe();
      setFuncionarioDetalhe(null);
      setMensagem("Funcionário excluído com sucesso.");
    } catch (error) {
      console.error(error);
      setErro("Não foi possível excluir o funcionário.");
    }
  }

  async function handleSubmit(evento) {
    evento.preventDefault();
    if (salvando) return;

    setSalvando(true);
    setErro("");
    setMensagem("");

    const payload = {
      nome: formData.nome.trim(),
      email: formData.email.trim(),
      cpf: formData.cpf.trim(),
      nivelAcesso: formData.nivelAcesso,
      senha: formData.senha,
    };

    try {
      if (funcionarioEmEdicao) {
        await api.put(`/funcionarios/${funcionarioEmEdicao.id}`, payload);
      } else {
        await api.post("/funcionarios", payload);
      }

      await carregarEquipe();
      setIsModalOpen(false);
      setFuncionarioEmEdicao(null);
      setFormData({ ...FORMULARIO_VAZIO });

      setMensagem(
        funcionarioEmEdicao
          ? "Funcionário atualizado com sucesso."
          : "Funcionário cadastrado com sucesso.",
      );
    } catch (error) {
      console.error(error);
      setErro("Não foi possível salvar o funcionário. Verifique os dados.");
    } finally {
      setSalvando(false);
    }
  }

  const busca = termoBusca.trim().toLowerCase();

  const equipeFiltrada = equipe.filter((funcionario) => {
    const nome = String(funcionario.nome || "").toLowerCase();
    const matricula = String(funcionario.matricula || "").toLowerCase();

    const correspondeBusca = nome.includes(busca) || matricula.includes(busca);

    const correspondeCargo =
      filtroCargo === "TODOS" || funcionario.nivelAcesso === filtroCargo;

    return correspondeBusca && correspondeCargo;
  });

  const totalMecanicos = equipe.filter(
    (funcionario) => funcionario.nivelAcesso === "MECANICO",
  ).length;

  const totalGerentes = equipe.filter(
    (funcionario) => funcionario.nivelAcesso === "GERENTE",
  ).length;

  return (
    <div className="equipe-pagina">
      <header className="equipe-pagina-header">
        <div>
          <div className="equipe-pagina-heading">
            <span className="equipe-pagina-heading-icon">♙</span>
            <h2>Gestão de Equipe</h2>
          </div>
          <p>Organize os colaboradores, cargos e informações da oficina.</p>
        </div>

        <span className="equipe-pagina-etiqueta">
          Colaboradores cadastrados
        </span>
      </header>

      {erro && (
        <div
          className="equipe-pagina-alerta equipe-pagina-alerta-erro"
          role="alert"
        >
          {erro}
        </div>
      )}

      {mensagem && (
        <div
          className="equipe-pagina-alerta equipe-pagina-alerta-sucesso"
          role="status"
        >
          {mensagem}
        </div>
      )}

      <div className="equipe-pagina-indicadores">
        <div className="equipe-pagina-indicador">
          <span className="equipe-pagina-indicador-icone">♙</span>
          <div>
            <strong>{equipe.length}</strong>
            <span>Total de colaboradores</span>
          </div>
        </div>

        <div className="equipe-pagina-indicador">
          <span className="equipe-pagina-indicador-icone mecanicos">⚙</span>
          <div>
            <strong>{totalMecanicos}</strong>
            <span>Mecânicos</span>
          </div>
        </div>

        <div className="equipe-pagina-indicador">
          <span className="equipe-pagina-indicador-icone gerentes">◈</span>
          <div>
            <strong>{totalGerentes}</strong>
            <span>Gerentes</span>
          </div>
        </div>
      </div>

      <div className="equipe-pagina-toolbar">
        <div className="equipe-pagina-busca">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            aria-label="Pesquisar funcionários"
            placeholder="Pesquisar por nome ou matrícula..."
            value={termoBusca}
            onChange={(evento) => setTermoBusca(evento.target.value)}
          />
        </div>

        <select
          className="equipe-pagina-filtro"
          aria-label="Filtrar por cargo"
          value={filtroCargo}
          onChange={(evento) => setFiltroCargo(evento.target.value)}
        >
          <option value="TODOS">Todos os cargos</option>
          <option value="MECANICO">Mecânicos</option>
          <option value="GERENTE">Gerentes</option>
        </select>

        <button
          type="button"
          className="equipe-pagina-btn equipe-pagina-btn-primary"
          onClick={abrirModalNovo}
        >
          ＋ Adicionar funcionário
        </button>
      </div>

      {carregando ? (
        <div className="equipe-pagina-vazio">
          <h3>Carregando equipe...</h3>
          <p>Buscando os colaboradores cadastrados.</p>
        </div>
      ) : equipeFiltrada.length === 0 ? (
        <div className="equipe-pagina-vazio">
          <span aria-hidden="true">♙</span>
          <h3>Nenhum funcionário encontrado</h3>
          <p>
            {busca || filtroCargo !== "TODOS"
              ? "Tente alterar os filtros ou a pesquisa."
              : "Ainda não há funcionários cadastrados."}
          </p>
        </div>
      ) : (
        <div className="equipe-pagina-grid">
          {equipeFiltrada.map((funcionario, index) => (
            <article
              key={funcionario.id ?? `${funcionario.email}-${index}`}
              className="equipe-pagina-card"
            >
              <div className="equipe-pagina-card-topo">
                <span className="equipe-pagina-avatar">
                  {obterIniciais(funcionario.nome)}
                </span>

                <span className="equipe-pagina-cargo">
                  {formatarCargo(funcionario.nivelAcesso)}
                </span>
              </div>

              <h3>{funcionario.nome || "Funcionário sem nome"}</h3>

              <p className="equipe-pagina-card-subtitulo">
                {formatarCargo(funcionario.nivelAcesso)}
              </p>

              <div className="equipe-pagina-informacoes">
                <div>
                  <span>E-mail</span>
                  <strong>{funcionario.email || "Não informado"}</strong>
                </div>
                <div>
                  <span>Matrícula</span>
                  <strong>{funcionario.matricula || "Não informada"}</strong>
                </div>
              </div>

              <div className="equipe-pagina-acoes">
                <button
                  type="button"
                  className="equipe-pagina-btn equipe-pagina-btn-outline"
                  onClick={() => setFuncionarioDetalhe(funcionario)}
                >
                  Detalhes
                </button>

                <button
                  type="button"
                  className="equipe-pagina-btn equipe-pagina-btn-outline"
                  onClick={() => abrirModalEdicao(funcionario)}
                >
                  Editar
                </button>

                <button
                  type="button"
                  className="equipe-pagina-btn equipe-pagina-btn-danger"
                  onClick={() => handleExcluir(funcionario.id)}
                >
                  Excluir
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {funcionarioDetalhe &&
        createPortal(
          <div
            className="modal-overlay equipe-pagina-modal-overlay"
            onMouseDown={(evento) => {
              if (evento.target === evento.currentTarget) {
                setFuncionarioDetalhe(null);
              }
            }}
          >
            <div
              className="modal-content equipe-pagina-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="equipe-detalhes-titulo"
            >
              <div className="equipe-pagina-modal-header">
                <div>
                  <span className="equipe-pagina-modal-etiqueta">
                    INFORMAÇÕES DO COLABORADOR
                  </span>
                  <h2 id="equipe-detalhes-titulo">Ficha do funcionário</h2>
                </div>

                <button
                  type="button"
                  className="equipe-pagina-fechar"
                  aria-label="Fechar detalhes"
                  onClick={() => setFuncionarioDetalhe(null)}
                >
                  ×
                </button>
              </div>

              <div className="equipe-pagina-detalhes">
                <div>
                  <span>Identificação</span>
                  <strong>Funcionário #{funcionarioDetalhe.id}</strong>
                </div>
                <div>
                  <span>Nome completo</span>
                  <strong>{funcionarioDetalhe.nome}</strong>
                </div>
                <div>
                  <span>E-mail</span>
                  <strong>{funcionarioDetalhe.email}</strong>
                </div>
                <div>
                  <span>CPF</span>
                  <strong>{funcionarioDetalhe.cpf || "Não informado"}</strong>
                </div>
                <div>
                  <span>Matrícula</span>
                  <strong>
                    {funcionarioDetalhe.matricula || "Não informada"}
                  </strong>
                </div>
                <div>
                  <span>Cargo / nível de acesso</span>
                  <strong>
                    {formatarCargo(funcionarioDetalhe.nivelAcesso)}
                  </strong>
                </div>
              </div>

              <div className="equipe-pagina-modal-acoes">
                <button
                  type="button"
                  className="equipe-pagina-btn equipe-pagina-btn-outline"
                  onClick={() => setFuncionarioDetalhe(null)}
                >
                  Fechar
                </button>

                <button
                  type="button"
                  className="equipe-pagina-btn equipe-pagina-btn-primary"
                  onClick={() => {
                    const funcionario = funcionarioDetalhe;
                    setFuncionarioDetalhe(null);
                    abrirModalEdicao(funcionario);
                  }}
                >
                  Editar funcionário
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {isModalOpen &&
        createPortal(
          <div
            className="modal-overlay equipe-pagina-modal-overlay"
            onMouseDown={(evento) => {
              if (evento.target === evento.currentTarget && !salvando) {
                setIsModalOpen(false);
              }
            }}
          >
            <div
              className="modal-content equipe-pagina-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="equipe-form-titulo"
            >
              <div className="equipe-pagina-modal-header">
                <div>
                  <span className="equipe-pagina-modal-etiqueta">
                    COLABORADORES GEARFLOW
                  </span>
                  <h2 id="equipe-form-titulo">
                    {funcionarioEmEdicao
                      ? "Editar funcionário"
                      : "Novo funcionário"}
                  </h2>
                </div>

                <button
                  type="button"
                  className="equipe-pagina-fechar"
                  aria-label="Fechar formulário"
                  disabled={salvando}
                  onClick={() => setIsModalOpen(false)}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="equipe-pagina-form-group">
                  <label htmlFor="func-nome">Nome completo</label>
                  <input
                    id="func-nome"
                    type="text"
                    name="nome"
                    className="equipe-pagina-input"
                    placeholder="Nome do colaborador"
                    value={formData.nome}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="equipe-pagina-form-group">
                  <label htmlFor="func-email">E-mail</label>
                  <input
                    id="func-email"
                    type="email"
                    name="email"
                    className="equipe-pagina-input"
                    placeholder="colaborador@exemplo.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="equipe-pagina-form-group">
                  <label htmlFor="func-cpf">CPF</label>
                  <input
                    id="func-cpf"
                    type="text"
                    name="cpf"
                    className="equipe-pagina-input"
                    placeholder="CPF do colaborador"
                    value={formData.cpf}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="equipe-pagina-form-group">
                  <label htmlFor="func-cargo">Cargo / nível de acesso</label>
                  <select
                    id="func-cargo"
                    name="nivelAcesso"
                    className="equipe-pagina-input"
                    value={formData.nivelAcesso}
                    onChange={handleChange}
                  >
                    <option value="MECANICO">Mecânico</option>
                    <option value="GERENTE">Gerente</option>
                  </select>
                </div>

                <div className="equipe-pagina-form-group">
                  <label htmlFor="func-senha">
                    Senha{" "}
                    {funcionarioEmEdicao && "(deixe em branco para manter)"}
                  </label>
                  <input
                    id="func-senha"
                    type="password"
                    name="senha"
                    className="equipe-pagina-input"
                    placeholder={
                      funcionarioEmEdicao
                        ? "Opcional na edição"
                        : "Defina uma senha"
                    }
                    value={formData.senha}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required={!funcionarioEmEdicao}
                  />
                </div>

                <div className="equipe-pagina-modal-acoes">
                  <button
                    type="button"
                    className="equipe-pagina-btn equipe-pagina-btn-outline"
                    disabled={salvando}
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="equipe-pagina-btn equipe-pagina-btn-primary"
                    disabled={salvando}
                  >
                    {salvando
                      ? "Salvando..."
                      : funcionarioEmEdicao
                        ? "Salvar alterações"
                        : "Cadastrar funcionário"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
