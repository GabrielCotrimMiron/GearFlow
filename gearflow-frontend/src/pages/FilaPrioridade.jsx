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
    ABERTA: "Aberta",
    EM_ANALISE: "Em análise",
    AGUARDANDO_APROVACAO: "Aguardando aprovação",
    EM_EXECUCAO: "Em execução",
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

  // Listas carregadas do Backend para os Modais
  const [veiculos, setVeiculos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [pecasCatalogo, setPecasCatalogo] = useState([]);
  const [servicosCatalogo, setServicosCatalogo] = useState([]);

  // Estados do Modal de Criação de OS (RF06 e RF16)
  const hoje = new Date().toISOString().split("T")[0];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [criandoOS, setCriandoOS] = useState(false);
  const [formData, setFormData] = useState({
    veiculoId: "", // <-- Agora inicia vazio, exigindo selecionar um veículo real
    funcionarioId: "",
    dataEntrada: hoje,
    previsaoEntrega: "",
    prioridade: "NORMAL",
    obsDiag: "",
  });

  // Estados do Modal de Execução do Serviço (RF07) e Controle de Status (RF08)
  const [osEmExecucao, setOsEmExecucao] = useState(null);
  const [mecanicoAtivoId, setMecanicoAtivoId] = useState("");
  const [novoStatus, setNovoStatus] = useState("");
  const [tipoItem, setTipoItem] = useState("PECA");
  const [itemCatalogoId, setItemCatalogoId] = useState("");
  const [quantidadeItem, setQuantidadeItem] = useState(1);
  const [processandoExecucao, setProcessandoExecucao] = useState(false);

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

  async function carregarCadastrosAuxiliares() {
    const authHeader = { Authorization: gerarAutorizacaoBasica() };
    try {
      const resVeic = await api.get("/veiculos", { headers: authHeader });
      setVeiculos(Array.isArray(resVeic.data) ? resVeic.data : []);
    } catch (e) {
      console.error("Erro ao buscar veículos:", e);
    }

    try {
      const resFunc = await api.get("/funcionarios", { headers: authHeader });
      setFuncionarios(Array.isArray(resFunc.data) ? resFunc.data : []);
    } catch (e) {
      console.error("Erro ao buscar funcionários:", e);
    }

    try {
      const resPecas = await api.get("/pecas", { headers: authHeader });
      const listaPecas = Array.isArray(resPecas.data) ? resPecas.data : [];
      setPecasCatalogo(listaPecas.filter((p) => (p.qtdEstoque ?? 0) > 0));
    } catch (e) {
      console.error("Erro ao buscar peças:", e);
    }

    try {
      const resServ = await api.get("/servicos", { headers: authHeader });
      const listaServ = Array.isArray(resServ.data) ? resServ.data : [];
      setServicosCatalogo(listaServ);
    } catch (e) {
      console.error("Erro ao buscar serviços:", e);
    }
  }

  useEffect(() => {
    carregarFila();
  }, []);

  async function abrirModalNovaOS() {
    setErro("");
    setMensagem("");
    setFormData({
      veiculoId: "", // <-- Limpa o campo para obrigar a escolha de um veículo cadastrado
      funcionarioId: "",
      dataEntrada: hoje,
      previsaoEntrega: "",
      prioridade: "NORMAL",
      obsDiag: "",
    });
    setIsModalOpen(true);
    await carregarCadastrosAuxiliares();
  }

  async function abrirModalExecucao(ordem) {
    setErro("");
    setMensagem("");
    setOsEmExecucao(ordem);
    setMecanicoAtivoId(ordem.mecanicoId ? String(ordem.mecanicoId) : "");
    setNovoStatus(ordem.status || "ABERTA");
    setTipoItem("PECA");
    setItemCatalogoId("");
    setQuantidadeItem(1);
    await carregarCadastrosAuxiliares();
  }

  function handleFormChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  // RF06 e RF16 - Criar Ordem de Serviço
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
          "Não foi possível criar a Ordem de Serviço.";
      setErro(msgBackend);
    } finally {
      setCriandoOS(false);
    }
  }

  // RF08 - Avançar status (exclusivo do mecânico designado)
  async function handleAvancarStatus(e) {
    e.preventDefault();
    if (!osEmExecucao) return;
    setProcessandoExecucao(true);
    setErro("");
    setMensagem("");

    try {
      const payload = {
        novoStatus,
        funcionarioId: mecanicoAtivoId ? parseInt(mecanicoAtivoId, 10) : null,
      };

      const resposta = await api.put(
          `/ordens-servico/${osEmExecucao.id}/status`,
          payload,
          {
            headers: { Authorization: gerarAutorizacaoBasica() },
          },
      );

      setOsEmExecucao(resposta.data);
      await carregarFila();
      setMensagem(
          `Status da OS #${osEmExecucao.id} avançado para ${formatarStatus(novoStatus)}!`,
      );
    } catch (error) {
      const msg =
          error.response?.data?.message ||
          "Apenas o mecânico designado nesta OS pode avançar o status.";
      alert(msg);
    } finally {
      setProcessandoExecucao(false);
    }
  }

  // RF07 - Adicionar Peça ou Serviço na OS
  async function handleAdicionarItem(e) {
    e.preventDefault();
    if (!osEmExecucao || !itemCatalogoId) return;
    setProcessandoExecucao(true);
    setErro("");
    setMensagem("");

    try {
      const payload = {
        tipo: tipoItem,
        itemCatalogoId: parseInt(itemCatalogoId, 10),
        quantidade: parseInt(quantidadeItem, 10) || 1,
        funcionarioId: mecanicoAtivoId ? parseInt(mecanicoAtivoId, 10) : null,
      };

      const resposta = await api.post(
          `/ordens-servico/${osEmExecucao.id}/itens`,
          payload,
          {
            headers: { Authorization: gerarAutorizacaoBasica() },
          },
      );

      setOsEmExecucao(resposta.data);
      setItemCatalogoId("");
      setQuantidadeItem(1);
      await carregarFila();
      await carregarCadastrosAuxiliares();
      setMensagem(`Item adicionado com sucesso na OS #${osEmExecucao.id}!`);
    } catch (error) {
      const msg =
          error.response?.data?.message ||
          "Erro ao adicionar item na OS. Verifique o estoque ou o mecânico responsável.";
      alert(msg);
    } finally {
      setProcessandoExecucao(false);
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
      setErro("Não foi possível salvar a prioridade. Tente novamente.");
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
              <h2>Controle de Prioridades e Execução de OS</h2>
            </div>

            <p>
              Organize os atendimentos, adicione peças/serviços consumidos e avance o status das ordens.
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
                          <th>ORDEM / VEÍCULO</th>
                          <th>MECÂNICO</th>
                          <th>STATUS</th>
                          <th>ENTRADA / PREVISÃO</th>
                          <th>PRIORIDADE</th>
                          <th>EXECUÇÃO</th>
                        </tr>
                        </thead>

                        <tbody>
                        {ordensFiltradas.map((ordem) => (
                            <tr key={ordem.id}>
                              <td>
                          <span className="fila-os-numero">
                            OS #{ordem.id}
                          </span>
                                <div style={{ fontSize: "11px", color: "#718096", marginTop: "3px" }}>
                                  {ordem.veiculoDescricao} ({ordem.veiculoPlaca})
                                </div>
                              </td>

                              <td>
                                <strong>{ordem.mecanicoNome || "Não designado"}</strong>
                              </td>

                              <td>
                          <span className="fila-status">
                            <span className="fila-status-ponto" />
                            {formatarStatus(ordem.status)}
                          </span>
                              </td>

                              <td>
                                <div>Entrada: {formatarData(ordem.dataEntrada)}</div>
                                <div style={{ fontSize: "11px", color: "#718096" }}>
                                  Prev.: {formatarData(ordem.previsaoEntrega)}
                                </div>
                              </td>

                              <td>
                                <div className="fila-prioridade-campo">
                            <span
                                className={`fila-prioridade-ponto prioridade-${ordem.prioridade || "NORMAL"}`}
                            />
                                  <select
                                      id={`prioridade-${ordem.id}`}
                                      className="fila-prioridade-select"
                                      value={ordem.prioridade || "NORMAL"}
                                      disabled={salvandoId !== null}
                                      onChange={(e) =>
                                          alterarPrioridade(ordem.id, e.target.value)
                                      }
                                  >
                                    <option value="URGENTE">Urgente</option>
                                    <option value="ALTA">Alta</option>
                                    <option value="NORMAL">Normal</option>
                                  </select>
                                </div>
                              </td>

                              <td>
                                <button
                                    type="button"
                                    className="btn-action btn-edit"
                                    onClick={() => abrirModalExecucao(ordem)}
                                >
                                  🔧 Executar / Status
                                </button>
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

                                  <td>{formatarData(ordem.previsaoEntrega)}</td>

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
                        <label className="form-label">Mecânico Responsável (Designado)</label>
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
                                {f.nome} (Matrícula: {f.matricula || f.id})
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

        {/* MODAL DE EXECUÇÃO DO SERVIÇO (RF07) E CONTROLE DE STATUS (RF08) */}
        {osEmExecucao &&
            createPortal(
                <div className="modal-overlay">
                  <div className="modal-content" style={{ maxWidth: "680px" }}>
                    <div className="modal-header">
                      <h2 style={{ color: "var(--gf-primary-dark)" }}>
                        Execução da OS #{osEmExecucao.id} — {osEmExecucao.veiculoPlaca}
                      </h2>
                      <button
                          type="button"
                          className="btn-close"
                          onClick={() => setOsEmExecucao(null)}
                      >
                        ×
                      </button>
                    </div>

                    <div style={{ marginBottom: "16px", fontSize: "13px", color: "#4A5568" }}>
                      <p>
                        <strong>Veículo:</strong> {osEmExecucao.veiculoDescricao} |{" "}
                        <strong>Mecânico Designado:</strong> {osEmExecucao.mecanicoNome}
                      </p>
                      {osEmExecucao.obsDiag && (
                          <p style={{ marginTop: "4px" }}>
                            <strong>Diagnóstico Inicial:</strong> {osEmExecucao.obsDiag}
                          </p>
                      )}
                    </div>

                    {/* IDENTIFICAÇÃO DO MECÂNICO OPERADOR PARA VALIDAR RF08 */}
                    <div className="form-group" style={{ background: "#F7FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                      <label className="form-label">
                        👨‍🔧 Mecânico Operando Agora (Validação RF08)
                      </label>
                      <select
                          value={mecanicoAtivoId}
                          onChange={(e) => setMecanicoAtivoId(e.target.value)}
                          className="form-input"
                      >
                        <option value="">Selecione quem está operando...</option>
                        {funcionarios.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.nome} {f.id === osEmExecucao.mecanicoId ? "(Designado nesta OS)" : ""}
                            </option>
                        ))}
                      </select>
                      <small style={{ color: "#718096", display: "block", marginTop: "4px" }}>
                        * O sistema bloqueia alterações caso outro mecânico não designado tente avançar a OS.
                      </small>
                    </div>

                    {/* RF08 - AVANÇAR STATUS */}
                    <form onSubmit={handleAvancarStatus} style={{ marginTop: "16px", paddingBottom: "16px", borderBottom: "1px solid #E2E8F0" }}>
                      <label className="form-label">Controle de Status de Andamento (RF08)</label>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <select
                            value={novoStatus}
                            onChange={(e) => setNovoStatus(e.target.value)}
                            className="form-input"
                            style={{ flex: 1 }}
                        >
                          <option value="ABERTA">Aberta</option>
                          <option value="EM_ANALISE">Em Análise</option>
                          <option value="AGUARDANDO_APROVACAO">Aguardando Aprovação</option>
                          <option value="EM_EXECUCAO">Em Execução</option>
                          <option value="FINALIZADA">Finalizada</option>
                        </select>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={processandoExecucao}
                        >
                          Avançar Status
                        </button>
                      </div>
                    </form>

                    {/* RF07 - ADICIONAR PEÇAS E SERVIÇOS */}
                    <form onSubmit={handleAdicionarItem} style={{ marginTop: "16px" }}>
                      <label className="form-label">Adicionar Peça Consumida ou Serviço Executado (RF07)</label>
                      <div style={{ display: "grid", gridTemplateColumns: "130px 1fr 90px auto", gap: "8px", alignItems: "center" }}>
                        <select
                            value={tipoItem}
                            onChange={(e) => {
                              setTipoItem(e.target.value);
                              setItemCatalogoId("");
                            }}
                            className="form-input"
                        >
                          <option value="PECA">⚙️ Peça</option>
                          <option value="SERVICO">🛠️ Serviço</option>
                        </select>

                        <select
                            value={itemCatalogoId}
                            onChange={(e) => setItemCatalogoId(e.target.value)}
                            className="form-input"
                            required
                        >
                          <option value="">
                            {tipoItem === "PECA" ? "Selecione a peça..." : "Selecione o serviço..."}
                          </option>
                          {tipoItem === "PECA"
                              ? pecasCatalogo.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.descricao} — R$ {Number(p.valorUni || 0).toFixed(2)} (Est: {p.qtdEstoque})
                                  </option>
                              ))
                              : servicosCatalogo.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.descricao} — R$ {Number(s.valorUni || 0).toFixed(2)}
                                  </option>
                              ))}
                        </select>

                        <input
                            type="number"
                            min="1"
                            value={quantidadeItem}
                            onChange={(e) => setQuantidadeItem(e.target.value)}
                            className="form-input"
                            title="Quantidade"
                            required
                        />

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={processandoExecucao}
                        >
                          + Incluir
                        </button>
                      </div>
                    </form>

                    {/* LISTA DE ITENS LANÇADOS NA OS */}
                    <div style={{ marginTop: "20px" }}>
                      <h4 style={{ color: "#2A4454", marginBottom: "8px" }}>
                        Itens Consumidos e Serviços Realizados na OS
                      </h4>
                      {(!osEmExecucao.itens || osEmExecucao.itens.length === 0) ? (
                          <p style={{ fontSize: "12px", color: "#718096" }}>
                            Nenhuma peça ou serviço lançado nesta OS até o momento.
                          </p>
                      ) : (
                          <ul style={{ listStyle: "none", padding: 0, maxHeight: "160px", overflowY: "auto", border: "1px solid #EDF2F7", borderRadius: "8px" }}>
                            {osEmExecucao.itens.map((item) => (
                                <li
                                    key={item.id}
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      padding: "8px 12px",
                                      borderBottom: "1px solid #EDF2F7",
                                      fontSize: "13px",
                                    }}
                                >
                        <span>
                          <strong>{item.qtd}x</strong> {item.descricao}
                        </span>
                                  <strong>
                                    R$ {(Number(item.valorUni || 0) * Number(item.qtd || 1)).toFixed(2)}
                                  </strong>
                                </li>
                            ))}
                          </ul>
                      )}

                      <div style={{ marginTop: "12px", textAlign: "right", fontSize: "16px", color: "#2A4454" }}>
                        <strong>Total da OS: R$ {Number(osEmExecucao.valorTotal || 0).toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                </div>,
                document.body,
            )}
      </div>
  );
}