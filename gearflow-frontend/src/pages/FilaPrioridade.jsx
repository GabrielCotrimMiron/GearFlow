import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../services/api";
import { gerarAutorizacaoBasica } from "../services/clienteAuth";
import "./FilaPrioridade.css";

const PESO_PRIORIDADE = {
  URGENTE: 0,
  ALTA: 1,
  NORMAL: 2,
};

function formatarData(data) {
  if (!data) return "Não informada";

  const partes = data.split("-");

  if (partes.length !== 3) return data;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarStatus(status) {
  const nomes = {
    EM_EXECUCAO: "Em execução",
    ABERTA: "Aberta",
    PENDENTE: "Pendente",
    FINALIZADA: "Finalizada",
  };

  return nomes[status] || status?.replaceAll("_", " ") || "Não informado";
}

function ordenarOrdens(a, b) {
  const pesoA = PESO_PRIORIDADE[a.prioridade] ?? 2;
  const pesoB = PESO_PRIORIDADE[b.prioridade] ?? 2;

  if (pesoA !== pesoB) return pesoA - pesoB;

  return (
      (a.dataEntrada || "").localeCompare(b.dataEntrada || "") ||
      a.id - b.id
  );
}

export default function FilaPrioridade() {
  const [ordens, setOrdens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvandoId, setSalvandoId] = useState(null);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [falhaCarregamento, setFalhaCarregamento] = useState(false);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [filtro, setFiltro] = useState("TODAS");

  // Estados para Criacao de Nova OS (RF06 e RF16)
  const hoje = new Date().toISOString().split("T")[0];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [veiculos, setVeiculos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [criandoOS, setCriandoOS] = useState(false);
  const [formData, setFormData] = useState({
    veiculoId: "",
    funcionarioId: "",
    dataEntrada: hoje,
    previsaoEntrega: "",
    prioridade: "NORMAL",
    obsDiag: "",
  });

  async function carregarFila() {
    try {
      const resposta = await api.get("/ordens-servico/fila-prioridade", {
        headers: {
          Authorization: gerarAutorizacaoBasica(),
        },
      });

      setOrdens(resposta.data);
      setFalhaCarregamento(false);
    } catch (error) {
      setFalhaCarregamento(true);

      setErro(
          error.response?.status === 401
              ? "Sua sessão expirou. Faça login novamente."
              : error.response?.status === 403
                  ? "Você não tem permissão para acessar a fila."
                  : "Não foi possível carregar as ordens de serviço.",
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarFila();
  }, []);

  async function abrirModalNovaOS() {
    setErro("");
    setMensagem("");
    setFormData({
      veiculoId: "",
      funcionarioId: "",
      dataEntrada: hoje,
      previsaoEntrega: "",
      prioridade: "NORMAL",
      obsDiag: "",
    });
    setIsModalOpen(true);

    try {
      const authHeader = { Authorization: gerarAutorizacaoBasica() };

      // Buscamos em rotas separadas para o erro de uma não impedir a outra de aparecer
      try {
        const resVeiculos = await api.get("/veiculos", { headers: authHeader });
        setVeiculos(Array.isArray(resVeiculos.data) ? resVeiculos.data : []);
      } catch (e) {
        console.error("Erro ao carregar veículos:", e);
      }

      try {
        const resFuncionarios = await api.get("/funcionarios", { headers: authHeader });
        setFuncionarios(Array.isArray(resFuncionarios.data) ? resFuncionarios.data : []);
      } catch (e) {
        console.error("Erro ao carregar funcionários:", e);
      }

    } catch (err) {
      console.error("Erro geral ao abrir modal:", err);
    }
  }

  function handleFormChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleCriarOS(e) {
    e.preventDefault();
    setCriandoOS(true);
    setErro("");
    setMensagem("");

    try {
      const payload = {
        veiculoId: parseInt(formData.veiculoId, 10),
        funcionarioId: formData.funcionarioId
            ? parseInt(formData.funcionarioId, 10)
            : null,
        dataEntrada: formData.dataEntrada,
        previsaoEntrega: formData.previsaoEntrega,
        prioridade: formData.prioridade,
        obsDiag: formData.obsDiag,
      };

      const resposta = await api.post("/ordens-servico", payload, {
        headers: {
          Authorization: gerarAutorizacaoBasica(),
        },
      });

      setIsModalOpen(false);
      await carregarFila();
      setMensagem(
          `Ordem de Serviço #${resposta.data?.id || ""} aberta com sucesso!`,
      );
    } catch (error) {
      const msgBackend =
          error.response?.data?.message ||
          error.response?.data?.erro ||
          "Não foi possível criar a Ordem de Serviço. Verifique os dados informados.";
      setErro(msgBackend);
    } finally {
      setCriandoOS(false);
    }
  }

  async function alterarPrioridade(id, prioridade) {
    setSalvandoId(id);
    setErro("");
    setMensagem("");

    try {
      await api.put(`/ordens-servico/${id}/prioridade`, null, {
        params: { prioridade },
        headers: {
          Authorization: gerarAutorizacaoBasica(),
        },
      });

      setOrdens((anteriores) =>
          anteriores.map((ordem) =>
              ordem.id === id ? { ...ordem, prioridade } : ordem,
          ),
      );

      setMensagem(
          `Prioridade da OS #${id} atualizada para ${prioridade.toLowerCase()}.`,
      );
    } catch (error) {
      if (error.response?.status === 409) {
        setErro("Não é permitido alterar uma OS finalizada.");
      } else if (error.response?.status === 401) {
        setErro("Faça login novamente para continuar.");
      } else if (error.response?.status === 403) {
        setErro("Você não tem permissão para alterar prioridades.");
      } else {
        setErro("Não foi possível salvar a prioridade. Tente novamente.");
      }
    } finally {
      setSalvandoId(null);
    }
  }

  const ordensAtivas = ordens
      .filter((ordem) => ordem.status !== "FINALIZADA")
      .sort(ordenarOrdens);

  const ordensFinalizadas = ordens
      .filter((ordem) => ordem.status === "FINALIZADA")
      .sort((a, b) => b.id - a.id);

  const totalUrgentes = ordensAtivas.filter(
      (ordem) => ordem.prioridade === "URGENTE",
  ).length;

  const totalAltas = ordensAtivas.filter(
      (ordem) => ordem.prioridade === "ALTA",
  ).length;

  const totalNormais = ordensAtivas.filter(
      (ordem) => !ordem.prioridade || ordem.prioridade === "NORMAL",
  ).length;

  const ordensFiltradas =
      filtro === "TODAS"
          ? ordensAtivas
          : ordensAtivas.filter(
              (ordem) => (ordem.prioridade || "NORMAL") === filtro,
          );

  if (carregando) {
    return (
        <div className="fila-estado">
          <div className="fila-spinner" />
          <h3>Carregando fila...</h3>
          <p>Buscando as ordens de serviço.</p>
        </div>
    );
  }

  return (
      <div className="fila-pagina">
        <div className="fila-cabecalho">
          <div>
            <div className="fila-titulo-linha">
              <span className="fila-titulo-icone">⚑</span>
              <h2>Controle de Prioridades</h2>
            </div>

            <p>
              Organize os atendimentos conforme a urgência e acompanhe
              as ordens de serviço da oficina.
            </p>
          </div>

          <div className="fila-cabecalho-acoes">
            {!falhaCarregamento && (
                <span className="fila-situacao">
              <span className="fila-situacao-ponto" />
              Fila atualizada
            </span>
            )}

            <button
                type="button"
                className="btn-primary"
                onClick={abrirModalNovaOS}
            >
              + Nova Ordem de Serviço
            </button>
          </div>
        </div>

        {erro && (
            <div className="fila-alerta fila-alerta-erro" role="alert">
              <span aria-hidden="true">⚠</span>
              <span>{erro}</span>
            </div>
        )}

        {mensagem && (
            <div className="fila-alerta fila-alerta-sucesso" role="status">
              <span aria-hidden="true">✓</span>
              <span>{mensagem}</span>
            </div>
        )}

        {!falhaCarregamento && (
            <>
              <div className="fila-indicadores">
                <div className="fila-indicador fila-indicador-urgente">
                  <span className="fila-indicador-icone">!</span>
                  <div>
                    <strong>{totalUrgentes}</strong>
                    <span>Urgentes</span>
                  </div>
                </div>

                <div className="fila-indicador fila-indicador-alta">
                  <span className="fila-indicador-icone">↑</span>
                  <div>
                    <strong>{totalAltas}</strong>
                    <span>Prioridade alta</span>
                  </div>
                </div>

                <div className="fila-indicador fila-indicador-normal">
                  <span className="fila-indicador-icone">✓</span>
                  <div>
                    <strong>{totalNormais}</strong>
                    <span>Prioridade normal</span>
                  </div>
                </div>
              </div>

              <div className="fila-secao">
                <div className="fila-secao-cabecalho">
                  <div>
                    <h3>Ordens em andamento</h3>
                    <p>
                      {ordensAtivas.length}{" "}
                      {ordensAtivas.length === 1
                          ? "ordem aguardando atendimento ou em execução"
                          : "ordens aguardando atendimento ou em execução"}
                    </p>
                  </div>

                  <div className="fila-filtro-grupo">
                    <label htmlFor="fila-filtro">Filtrar por</label>
                    <select
                        id="fila-filtro"
                        className="fila-filtro"
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                    >
                      <option value="TODAS">Todas as prioridades</option>
                      <option value="URGENTE">Urgentes</option>
                      <option value="ALTA">Altas</option>
                      <option value="NORMAL">Normais</option>
                    </select>
                  </div>
                </div>

                {ordensFiltradas.length === 0 ? (
                    <div className="fila-vazio">
                      <span aria-hidden="true">☷</span>
                      <h4>Nenhuma ordem encontrada</h4>
                      <p>
                        {ordensAtivas.length === 0
                            ? "Não há ordens em andamento no momento."
                            : "Não existem ordens com a prioridade selecionada."}
                      </p>
                    </div>
                ) : (
                    <div className="fila-tabela-scroll">
                      <table className="fila-tabela">
                        <thead>
                        <tr>
                          <th>ORDEM</th>
                          <th>STATUS</th>
                          <th>ENTRADA</th>
                          <th>PREVISÃO</th>
                          <th>PRIORIDADE</th>
                        </tr>
                        </thead>

                        <tbody>
                        {ordensFiltradas.map((ordem) => (
                            <tr key={ordem.id}>
                              <td>
                          <span className="fila-os-numero">
                            OS #{ordem.id}
                          </span>
                              </td>

                              <td>
                          <span className="fila-status">
                            <span className="fila-status-ponto" />
                            {formatarStatus(ordem.status)}
                          </span>
                              </td>

                              <td>{formatarData(ordem.dataEntrada)}</td>

                              <td>{formatarData(ordem.previsaoEntrega)}</td>

                              <td>
                                <div className="fila-prioridade-campo">
                            <span
                                className={`fila-prioridade-ponto prioridade-${ordem.prioridade || "NORMAL"}`}
                            />

                                  <label
                                      className="fila-sr-only"
                                      htmlFor={`prioridade-${ordem.id}`}
                                  >
                                    Prioridade da OS #{ordem.id}
                                  </label>

                                  <select
                                      id={`prioridade-${ordem.id}`}
                                      className="fila-prioridade-select"
                                      value={ordem.prioridade || "NORMAL"}
                                      disabled={salvandoId !== null}
                                      onChange={(e) =>
                                          alterarPrioridade(
                                              ordem.id,
                                              e.target.value,
                                          )
                                      }
                                  >
                                    <option value="URGENTE">Urgente</option>
                                    <option value="ALTA">Alta</option>
                                    <option value="NORMAL">Normal</option>
                                  </select>
                                </div>

                                {salvandoId === ordem.id && (
                                    <span className="fila-salvando">
                              Salvando...
                            </span>
                                )}
                              </td>
                            </tr>
                        ))}
                        </tbody>
                      </table>
                    </div>
                )}
              </div>

              {ordensFinalizadas.length > 0 && (
                  <div className="fila-historico">
                    <button
                        type="button"
                        className="fila-historico-botao"
                        aria-expanded={mostrarHistorico}
                        onClick={() => setMostrarHistorico(!mostrarHistorico)}
                    >
                      <span className="fila-historico-icone">▤</span>

                      <span className="fila-historico-texto">
                  <strong>Histórico de ordens finalizadas</strong>
                  <small>
                    {ordensFinalizadas.length}{" "}
                    {ordensFinalizadas.length === 1
                        ? "ordem concluída"
                        : "ordens concluídas"}
                  </small>
                </span>

                      <span className="fila-historico-seta">
                  {mostrarHistorico ? "⌃" : "⌄"}
                </span>
                    </button>

                    {mostrarHistorico && (
                        <div className="fila-tabela-scroll">
                          <table className="fila-tabela fila-tabela-historico">
                            <thead>
                            <tr>
                              <th>ORDEM</th>
                              <th>STATUS</th>
                              <th>ENTRADA</th>
                              <th>PREVISÃO</th>
                              <th>PRIORIDADE</th>
                            </tr>
                            </thead>

                            <tbody>
                            {ordensFinalizadas.map((ordem) => (
                                <tr key={ordem.id}>
                                  <td>
                            <span className="fila-os-numero">
                              OS #{ordem.id}
                            </span>
                                  </td>

                                  <td>
                            <span className="fila-status-finalizada">
                              Finalizada
                            </span>
                                  </td>

                                  <td>{formatarData(ordem.dataEntrada)}</td>

                                  <td>
                                    {formatarData(ordem.previsaoEntrega)}
                                  </td>

                                  <td>
                            <span className="fila-prioridade-historico">
                              {ordem.prioridade || "NORMAL"}
                            </span>
                                  </td>
                                </tr>
                            ))}
                            </tbody>
                          </table>
                        </div>
                    )}
                  </div>
              )}
            </>
        )}

        {/* MODAL DE CRIAÇÃO DE NOVA OS (RF06 e RF16) */}
        {isModalOpen &&
            createPortal(
                <div className="modal-overlay">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h2 style={{ color: "var(--gf-primary-dark)" }}>
                        Abrir Nova Ordem de Serviço
                      </h2>
                      <button
                          type="button"
                          className="btn-close"
                          onClick={() => setIsModalOpen(false)}
                      >
                        ×
                      </button>
                    </div>

                    <form onSubmit={handleCriarOS}>
                      <div className="form-group">
                        <label className="form-label">Veículo</label>
                        <select
                            name="veiculoId"
                            value={formData.veiculoId}
                            onChange={handleFormChange}
                            className="form-input"
                            required
                        >
                          <option value="">Selecione um veículo cadastrado...</option>
                          {veiculos.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.placa} — {v.marca} {v.modelo}{" "}
                                {v.cliente?.nome ? `(${v.cliente.nome})` : ""}
                              </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Mecânico Responsável</label>
                        <select
                            name="funcionarioId"
                            value={formData.funcionarioId}
                            onChange={handleFormChange}
                            className="form-input"
                            required
                        >
                          <option value="">Selecione o mecânico...</option>
                          {funcionarios.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.nome} ({f.cargo || "Mecânico"})
                              </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Prioridade Inicial</label>
                        <select
                            name="prioridade"
                            value={formData.prioridade}
                            onChange={handleFormChange}
                            className="form-input"
                            required
                        >
                          <option value="NORMAL">Normal</option>
                          <option value="ALTA">Alta</option>
                          <option value="URGENTE">Urgente</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Data de Entrada</label>
                        <input
                            type="date"
                            name="dataEntrada"
                            value={formData.dataEntrada}
                            onChange={handleFormChange}
                            className="form-input"
                            required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Previsão de Entrega</label>
                        <input
                            type="date"
                            name="previsaoEntrega"
                            min={formData.dataEntrada || hoje}
                            value={formData.previsaoEntrega}
                            onChange={handleFormChange}
                            className="form-input"
                            required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Observações / Diagnóstico Inicial
                        </label>
                        <textarea
                            name="obsDiag"
                            rows="3"
                            placeholder="Descreva o relato do cliente ou defeito observado..."
                            value={formData.obsDiag}
                            onChange={handleFormChange}
                            className="form-input"
                        />
                      </div>

                      <button
                          type="submit"
                          className="btn-submit"
                          disabled={criandoOS}
                      >
                        {criandoOS ? "Registrando..." : "Gerar Ordem de Serviço"}
                      </button>
                    </form>
                  </div>
                </div>,
                document.body,
            )}
      </div>
  );
}