import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

import "./GestaoOrdensServicoRF09.css";

const moeda = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);

const dataBR = (data) => {
  if (!data) return "Não definida";
  const [ano, mes, dia] = data.split("-");
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : data;
};

const nomesStatus = {
  ABERTA: "Aberta",
  EM_ANALISE: "Em análise",
  AGUARDANDO_APROVACAO: "Aguardando aprovação",
  EM_EXECUCAO: "Em execução",
  FINALIZADA: "Finalizada",
  ORCAMENTO_REJEITADO: "Orçamento rejeitado",
};

const nomeStatus = (status) => nomesStatus[status] || status || "Não informado";

const hojeLocal = () => {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
};

const formularioInicial = () => ({
  veiculoId: "",
  funcionarioId: "",
  dataEntrada: hojeLocal(),
  previsaoEntrega: "",
  prioridade: "NORMAL",
  obsDiag: "",
});

const mensagemErro = (erro, alternativa) =>
  erro.response?.data?.message || erro.response?.data?.detail || alternativa;

function Aviso({ tipo = "erro", children }) {
  if (!children) return null;

  return (
    <div
      className={`gf-feedback gf-feedback-${tipo}`}
      role={tipo === "erro" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}

export default function GestaoOrdensServico() {
  const navigate = useNavigate();
  const [ordens, setOrdens] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [catalogoPecas, setCatalogoPecas] = useState([]);
  const [catalogoServicos, setCatalogoServicos] = useState([]);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");

  const [osDetalhe, setOsDetalhe] = useState(null);
  const [modalNovaOS, setModalNovaOS] = useState(false);
  const [formData, setFormData] = useState(formularioInicial);

  const [novoItemTipo, setNovoItemTipo] = useState("PECA");
  const [novoItemId, setNovoItemId] = useState("");
  const [novoItemQtd, setNovoItemQtd] = useState("1");
  const [adicionandoItem, setAdicionandoItem] = useState(false);
  const [feedbackItem, setFeedbackItem] = useState(null);

  const [desconto, setDesconto] = useState("0");
  const [fechandoRascunho, setFechandoRascunho] = useState(false);
  const [feedbackOrcamento, setFeedbackOrcamento] = useState(null);

  const [salvandoOS, setSalvandoOS] = useState(false);
  const [feedbackNovaOS, setFeedbackNovaOS] = useState("");
  const [alterandoPrioridade, setAlterandoPrioridade] = useState(null);
  const [finalizandoOS, setFinalizandoOS] = useState(false);

  const auth = () => ({
    "X-Client": "GearFlow",
  });

  const carregarDados = async (inicial = false) => {
    if (inicial) setCarregando(true);

    try {
      const [resOS, resVeic, resFunc, resPecas, resServicos] =
        await Promise.all([
          api.get("/ordens-servico", { headers: auth() }),
          api.get("/veiculos"),
          api.get("/funcionarios"),
          api.get("/pecas", { headers: auth() }),
          api.get("/servicos", { headers: auth() }),
        ]);

      const novasOrdens = Array.isArray(resOS.data) ? resOS.data : [];

      setOrdens(novasOrdens);
      setVeiculos(Array.isArray(resVeic.data) ? resVeic.data : []);
      setFuncionarios(Array.isArray(resFunc.data) ? resFunc.data : []);
      setCatalogoPecas(Array.isArray(resPecas.data) ? resPecas.data : []);
      setCatalogoServicos(
        Array.isArray(resServicos.data) ? resServicos.data : [],
      );

      setOsDetalhe((anterior) => {
        if (!anterior) return null;
        return novasOrdens.find((os) => os.id === anterior.id) || anterior;
      });

      setErroCarregamento("");
      return novasOrdens;
    } catch (erro) {
      console.error("Erro ao carregar gestão de OS:", erro);

      setErroCarregamento(
        erro.response?.status === 401
          ? "Sessão não autorizada. Verifique as credenciais."
          : erro.response?.status === 403
            ? "Seu usuário não tem permissão para consultar as ordens."
            : "Não foi possível carregar os dados. Verifique o servidor.",
      );

      return null;
    } finally {
      if (inicial) setCarregando(false);
    }
  };

  useEffect(() => {
    const iniciarCarregamento = async () => {
      await carregarDados(true);
    };

    iniciarCarregamento();
  }, []);
  const abrirDetalhes = (os) => {
    setOsDetalhe(os);
    setNovoItemTipo("PECA");
    setNovoItemId("");
    setNovoItemQtd("1");
    setDesconto(String(os.desconto ?? 0));
    setFeedbackItem(null);
    setFeedbackOrcamento(null);
  };

  const ocupado = adicionandoItem || fechandoRascunho || finalizandoOS;

  const fecharDetalhes = () => {
    if (ocupado) return;
    setOsDetalhe(null);
  };

  const abrirNovaOS = () => {
    setFormData(formularioInicial());
    setFeedbackNovaOS("");
    setModalNovaOS(true);
  };

  const criarOS = async (evento) => {
    evento.preventDefault();

    if (salvandoOS) return;

    if (formData.previsaoEntrega < formData.dataEntrada) {
      setFeedbackNovaOS(
        "A previsão de entrega não pode ser anterior à entrada.",
      );
      return;
    }

    setSalvandoOS(true);
    setFeedbackNovaOS("");

    try {
      await api.post(
        "/ordens-servico",
        {
          veiculoId: Number(formData.veiculoId),
          funcionarioId: Number(formData.funcionarioId),
          dataEntrada: formData.dataEntrada,
          previsaoEntrega: formData.previsaoEntrega,
          prioridade: formData.prioridade,
          obsDiag: formData.obsDiag,
        },
        { headers: auth() },
      );

      setModalNovaOS(false);
      await carregarDados();
    } catch (erro) {
      console.error("Erro ao carregar gestão de OS:", erro);
      console.error("URL:", erro.config?.url);
      console.error("Status HTTP:", erro.response?.status);
      console.error("Resposta do servidor:", erro.response?.data);
      console.error("Mensagem:", erro.message);
      setFeedbackNovaOS(
        mensagemErro(erro, "Não foi possível criar a ordem de serviço."),
      );
    } finally {
      setSalvandoOS(false);
    }
  };

  const alterarPrioridade = async (id, prioridade) => {
    if (alterandoPrioridade !== null) return;

    setAlterandoPrioridade(id);

    try {
      await api.put(`/ordens-servico/${id}/prioridade`, null, {
        params: { prioridade },
        headers: auth(),
      });

      await carregarDados();
    } catch (erro) {
      console.error("Erro ao alterar prioridade:", erro);
      setErroCarregamento(
        mensagemErro(erro, "Não foi possível alterar a prioridade."),
      );
    } finally {
      setAlterandoPrioridade(null);
    }
  };

  const catalogoAtual =
    novoItemTipo === "PECA" ? catalogoPecas : catalogoServicos;

  const itemSelecionado = catalogoAtual.find(
    (item) => String(item.id) === String(novoItemId),
  );

  const quantidadeNumerica = Number(novoItemQtd);

  const quantidadeValida =
    novoItemQtd.trim() !== "" &&
    Number.isInteger(quantidadeNumerica) &&
    quantidadeNumerica > 0;

  const estoqueDisponivel =
    novoItemTipo !== "PECA" ||
    (itemSelecionado &&
      quantidadeNumerica <= Number(itemSelecionado.qtdEstoque ?? 0));

  const podeAdicionar =
    osDetalhe?.statusOperac === "EM_ANALISE" &&
    itemSelecionado &&
    quantidadeValida &&
    estoqueDisponivel &&
    !adicionandoItem &&
    !fechandoRascunho;

  const adicionarItem = async () => {
    if (!osDetalhe || adicionandoItem) return;

    setFeedbackItem(null);

    if (!itemSelecionado) {
      setFeedbackItem({
        tipo: "erro",
        texto: "Selecione uma peça ou serviço.",
      });
      return;
    }

    if (!quantidadeValida) {
      setFeedbackItem({
        tipo: "erro",
        texto: "Informe uma quantidade inteira maior que zero.",
      });
      return;
    }

    if (!estoqueDisponivel) {
      setFeedbackItem({
        tipo: "erro",
        texto: "A quantidade solicitada supera o estoque disponível.",
      });
      return;
    }

    setAdicionandoItem(true);

    try {
      await api.post(
        `/ordens-servico/${osDetalhe.id}/itens`,
        {
          itemId: Number(novoItemId),
          quantidade: quantidadeNumerica,
        },
        { headers: auth() },
      );

      await carregarDados();

      setNovoItemId("");
      setNovoItemQtd("1");
      setFeedbackItem({
        tipo: "sucesso",
        texto: "Item incluído no orçamento com sucesso.",
      });
    } catch (erro) {
      console.error("Erro ao adicionar item:", erro);
      setFeedbackItem({
        tipo: "erro",
        texto: mensagemErro(
          erro,
          "Não foi possível adicionar o item. Confira o estoque.",
        ),
      });
    } finally {
      setAdicionandoItem(false);
    }
  };

  const valorBruto = Number(osDetalhe?.valorTotal ?? 0);
  const descontoNumerico = Number(desconto);

  const descontoValido =
    desconto.trim() !== "" &&
    /^\d+(\.\d{1,2})?$/.test(desconto) &&
    Number.isFinite(descontoNumerico) &&
    descontoNumerico >= 0 &&
    descontoNumerico <= valorBruto;

  const valorFinal = Math.max(
    0,
    valorBruto - (descontoValido ? descontoNumerico : 0),
  );

  const emAnalise = osDetalhe?.statusOperac === "EM_ANALISE";
  const itensOS = Array.isArray(osDetalhe?.itens) ? osDetalhe.itens : [];

  const fecharRascunho = async () => {
    if (!osDetalhe || !emAnalise || fechandoRascunho || adicionandoItem) {
      return;
    }

    setFeedbackOrcamento(null);

    if (!itensOS.length) {
      setFeedbackOrcamento({
        tipo: "erro",
        texto: "Adicione pelo menos um item antes de fechar o orçamento.",
      });
      return;
    }

    if (!descontoValido) {
      setFeedbackOrcamento({
        tipo: "erro",
        texto: "Informe um desconto válido, entre zero e o subtotal.",
      });
      return;
    }

    const confirmado = window.confirm(
      `Fechar orçamento da OS #${osDetalhe.id}?\n\n` +
        `Subtotal: ${moeda(valorBruto)}\n` +
        `Desconto: ${moeda(descontoNumerico)}\n` +
        `Valor final: ${moeda(valorFinal)}\n\n` +
        "O orçamento será enviado para aprovação do cliente.",
    );

    if (!confirmado) return;

    setFechandoRascunho(true);

    try {
      await api.put(`/ordens-servico/${osDetalhe.id}/fechar-rascunho`, null, {
        params: {
          desconto: descontoNumerico.toFixed(2),
        },
        headers: auth(),
      });

      setOsDetalhe((anterior) => ({
        ...anterior,
        statusOperac: "AGUARDANDO_APROVACAO",
        desconto: descontoNumerico,
        valorFinal,
      }));

      setFeedbackOrcamento({
        tipo: "sucesso",
        texto: "Orçamento fechado. Aguardando aprovação do cliente.",
      });

      await carregarDados();
    } catch (erro) {
      console.error("Erro ao fechar orçamento:", erro);
      setFeedbackOrcamento({
        tipo: "erro",
        texto: mensagemErro(erro, "Não foi possível fechar o orçamento."),
      });
    } finally {
      setFechandoRascunho(false);
    }
  };

  const finalizarOS = async () => {
    if (!osDetalhe || osDetalhe.statusOperac !== "EM_EXECUCAO" || ocupado) return;
    if (!window.confirm(`Finalizar a OS #${osDetalhe.id}? Essa ação não pode ser desfeita.`)) return;
    setFinalizandoOS(true);
    setFeedbackOrcamento(null);
    try {
      await api.put(`/ordens-servico/${osDetalhe.id}/finalizar`);
      setOsDetalhe((atual) => atual && { ...atual, statusOperac: "FINALIZADA", statusPag: "PENDENTE" });
      setFeedbackOrcamento({ tipo: "sucesso", texto: "OS finalizada. Pagamento pendente." });
      await carregarDados();
    } catch (erro) {
      setFeedbackOrcamento({ tipo: "erro", texto: mensagemErro(erro, "Não foi possível finalizar a OS.") });
    } finally {
      setFinalizandoOS(false);
    }
  };

  const ordensFiltradas = ordens.filter((os) => {
    if (filtroStatus !== "TODOS" && os.statusOperac !== filtroStatus) {
      return false;
    }

    const termo = busca.trim().toLowerCase();
    if (!termo) return true;

    const campos = [
      os.id,
      os.veiculo?.placa,
      os.veiculo?.marca,
      os.veiculo?.modelo,
      os.veiculo?.cliente?.nome,
      os.mecanResp?.nome,
      nomeStatus(os.statusOperac),
    ];

    return campos.some((campo) =>
      String(campo ?? "")
        .toLowerCase()
        .includes(termo),
    );
  }).sort((a, b) => {
    const peso = { URGENTE: 0, ALTA: 1, NORMAL: 2 };
    const prioridadeA = peso[a.prioridade] ?? 2;
    const prioridadeB = peso[b.prioridade] ?? 2;
    if (prioridadeA !== prioridadeB) return prioridadeA - prioridadeB;
    return String(a.dataEntrada ?? "").localeCompare(String(b.dataEntrada ?? ""));
  });

  const totalEmAnalise = ordens.filter(
    (os) => os.statusOperac === "EM_ANALISE",
  ).length;

  const totalAguardando = ordens.filter(
    (os) => os.statusOperac === "AGUARDANDO_APROVACAO",
  ).length;

  const totalExecucao = ordens.filter(
    (os) => os.statusOperac === "EM_EXECUCAO",
  ).length;

  return (
    <main className="gf-gestao">
      <header className="gf-gestao-topo">
        <div>
          <span className="gf-eyebrow">CENTRAL OPERACIONAL</span>
          <h1>Gestão de Ordens de Serviço</h1>
          <p>
            Acompanhe atendimentos, organize prioridades e prepare orçamentos.
          </p>
        </div>

        <button type="button" className="gf-btn-primario" onClick={abrirNovaOS}>
          + Nova Ordem de Serviço
        </button>
      </header>

      <section className="gf-indicadores" aria-label="Resumo das ordens">
        <div className="gf-indicador">
          <span>Total de ordens</span>
          <strong>{ordens.length}</strong>
          <small>Registradas no sistema</small>
        </div>

        <div className="gf-indicador">
          <span>Em análise</span>
          <strong>{totalEmAnalise}</strong>
          <small>Em preparação</small>
        </div>

        <div className="gf-indicador">
          <span>Aguardando cliente</span>
          <strong>{totalAguardando}</strong>
          <small>Pendentes de autorização</small>
        </div>

        <div className="gf-indicador">
          <span>Em execução</span>
          <strong>{totalExecucao}</strong>
          <small>Serviços autorizados</small>
        </div>
      </section>

      <div className="gf-gestao-filtros">
        <input
          type="search"
          className="gf-campo-busca"
          placeholder="Buscar OS, placa, veículo, cliente ou mecânico..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          aria-label="Buscar ordens de serviço"
        />

        <select
          className="gf-filtro-status"
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          aria-label="Filtrar por status"
        >
          <option value="TODOS">Todos os status</option>
          {Object.entries(nomesStatus).map(([valor, nome]) => (
            <option key={valor} value={valor}>
              {nome}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="gf-btn-secundario"
          onClick={() => carregarDados(true)}
          disabled={carregando}
        >
          {carregando ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      <Aviso>{erroCarregamento}</Aviso>

      {carregando ? (
        <div className="gf-estado-vazio">Carregando ordens de serviço...</div>
      ) : ordensFiltradas.length === 0 ? (
        <div className="gf-estado-vazio">
          Nenhuma ordem encontrada para os filtros selecionados.
        </div>
      ) : (
        <section className="gf-os-grid">
          {ordensFiltradas.map((os) => (
            <article
              key={os.id}
              className="gf-os-card"
              role="button"
              tabIndex={0}
              onClick={() => abrirDetalhes(os)}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  abrirDetalhes(os);
                }
              }}
            >
              <div className="gf-card-topo">
                <span className="gf-card-numero">OS #{os.id}</span>

                <span
                  className={`gf-status-tag gf-status-${os.statusOperac || "INDEFINIDO"}`}
                >
                  {nomeStatus(os.statusOperac)}
                </span>
              </div>

              <h3>
                {os.veiculo
                  ? `${os.veiculo.marca} ${os.veiculo.modelo}`
                  : "Veículo não informado"}
              </h3>

              <p className="gf-card-placa">
                {os.veiculo?.placa || "Placa não informada"}
              </p>

              <div className="gf-card-dados">
                <div>
                  <span>Cliente</span>
                  <strong>
                    {os.veiculo?.cliente?.nome || "Não informado"}
                  </strong>
                </div>

                <div>
                  <span>Mecânico</span>
                  <strong>{os.mecanResp?.nome || "Não atribuído"}</strong>
                </div>

                <div>
                  <span>Entrada</span>
                  <strong>{dataBR(os.dataEntrada)}</strong>
                </div>

                <div>
                  <span>Previsão</span>
                  <strong>{dataBR(os.previsaoEntrega)}</strong>
                </div>
              </div>

              <div
                className="gf-card-rodape"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="gf-prioridade-controle">
                  <label htmlFor={`prioridade-${os.id}`}>Prioridade</label>

                  <select
                    id={`prioridade-${os.id}`}
                    value={os.prioridade || "NORMAL"}
                    disabled={
                      alterandoPrioridade !== null ||
                      os.statusOperac === "FINALIZADA" ||
                      os.statusOperac === "AGUARDANDO_APROVACAO" ||
                      os.statusOperac === "ORCAMENTO_REJEITADO"
                    }
                    onChange={(e) => alterarPrioridade(os.id, e.target.value)}
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="ALTA">Alta</option>
                    <option value="URGENTE">Urgente</option>
                  </select>
                </div>

                <button
                  type="button"
                  className="gf-btn-detalhes"
                  onClick={() => navigate(`/inspecao-3d/${os.id}`)}
                  style={{ marginRight: 8 }}
                >
                  ◈ Inspeção 3D
                </button>
                <button
                  type="button"
                  className="gf-btn-detalhes"
                  onClick={() => abrirDetalhes(os)}
                >
                  Ver detalhes
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {osDetalhe &&
        createPortal(
          <div
            className="modal-overlay gf-overlay"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) fecharDetalhes();
            }}
          >
            <div
              className="modal-content gf-os-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="gf-titulo-detalhes"
            >
              <header className="gf-modal-cabecalho">
                <div>
                  <span className="gf-os-eyebrow">DETALHES DO ATENDIMENTO</span>
                  <h2 id="gf-titulo-detalhes">
                    Ordem de Serviço #{osDetalhe.id}
                  </h2>
                  <p>Informações, itens e revisão do orçamento.</p>
                </div>

                <button
                  type="button"
                  className="gf-modal-fechar"
                  onClick={fecharDetalhes}
                  disabled={ocupado}
                  aria-label="Fechar detalhes"
                >
                  ×
                </button>
              </header>

              <div className="gf-os-status-row">
                <span
                  className={`gf-status-tag gf-status-${osDetalhe.statusOperac}`}
                >
                  {nomeStatus(osDetalhe.statusOperac)}
                </span>

                <span className="gf-os-priority">
                  Prioridade: {osDetalhe.prioridade || "NORMAL"}
                </span>
              </div>

              <section className="gf-os-section">
                <h3 className="gf-os-section-title">
                  Informações do atendimento
                </h3>

                <div className="gf-os-info-grid">
                  <div className="gf-os-info-item">
                    <span>Veículo</span>
                    <strong>
                      {osDetalhe.veiculo
                        ? `${osDetalhe.veiculo.marca} ${osDetalhe.veiculo.modelo}`
                        : "Não informado"}
                    </strong>
                  </div>

                  <div className="gf-os-info-item">
                    <span>Placa</span>
                    <strong>{osDetalhe.veiculo?.placa || "N/A"}</strong>
                  </div>

                  <div className="gf-os-info-item">
                    <span>Cliente</span>
                    <strong>{osDetalhe.veiculo?.cliente?.nome || "N/A"}</strong>
                  </div>

                  <div className="gf-os-info-item">
                    <span>Mecânico</span>
                    <strong>
                      {osDetalhe.mecanResp?.nome || "Não atribuído"}
                    </strong>
                  </div>

                  <div className="gf-os-info-item">
                    <span>Data de entrada</span>
                    <strong>{dataBR(osDetalhe.dataEntrada)}</strong>
                  </div>

                  <div className="gf-os-info-item">
                    <span>Previsão de entrega</span>
                    <strong>{dataBR(osDetalhe.previsaoEntrega)}</strong>
                  </div>

                  <div className="gf-os-info-item">
                    <span>Status do pagamento</span>
                    <strong>{osDetalhe.statusPag || "Não informado"}</strong>
                  </div>
                </div>

                <div className="gf-os-diagnostico">
                  <span>Diagnóstico inicial</span>
                  <p>{osDetalhe.obsDiag || "Sem observações registradas."}</p>
                </div>
              </section>

              <section className="gf-os-section">
                <div className="gf-secao-cabecalho">
                  <div>
                    <span className="gf-os-eyebrow">
                      RF07 · PEÇAS E SERVIÇOS
                    </span>
                    <h3 className="gf-os-section-title">Itens do orçamento</h3>
                  </div>

                  <span className="gf-contador-itens">
                    {itensOS.length} {itensOS.length === 1 ? "item" : "itens"}
                  </span>
                </div>

                {itensOS.length ? (
                  <div className="gf-itens-lista">
                    {itensOS.map((item, index) => (
                      <div
                        key={`${item.id ?? "item"}-${index}`}
                        className="gf-item-linha"
                      >
                        <div className="gf-item-info">
                          <strong className="gf-item-descricao">
                            {item.descricao || "Item sem descrição"}
                          </strong>
                          <span className="gf-item-detalhes">
                            Quantidade: {item.quantidade ?? item.qtd ?? 1}
                            {item.valorUnitario != null &&
                              ` · Unitário: ${moeda(item.valorUnitario)}`}
                          </span>
                        </div>

                        <strong className="gf-item-subtotal">
                          {moeda(item.subtotal)}
                        </strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="gf-itens-vazio">
                    Nenhuma peça ou serviço adicionado.
                    <span>Selecione um item do catálogo para começar.</span>
                  </div>
                )}

                {emAnalise && (
                  <div className="gf-adicionar-item">
                    <h4>Adicionar ao orçamento</h4>
                    <p>
                      Selecione uma peça ou serviço e informe a quantidade
                      desejada.
                    </p>

                    <div className="gf-item-form-grid">
                      <div className="gf-item-campo">
                        <label htmlFor="gf-tipo-item">Tipo</label>
                        <select
                          id="gf-tipo-item"
                          value={novoItemTipo}
                          disabled={ocupado}
                          onChange={(e) => {
                            setNovoItemTipo(e.target.value);
                            setNovoItemId("");
                            setNovoItemQtd("1");
                            setFeedbackItem(null);
                          }}
                        >
                          <option value="PECA">Peça</option>
                          <option value="SERVICO">Serviço</option>
                        </select>
                      </div>

                      <div className="gf-item-campo">
                        <label htmlFor="gf-catalogo-item">
                          Item do catálogo
                        </label>
                        <select
                          id="gf-catalogo-item"
                          value={novoItemId}
                          disabled={ocupado}
                          onChange={(e) => {
                            setNovoItemId(e.target.value);
                            setFeedbackItem(null);
                          }}
                        >
                          <option value="">Selecione um item...</option>

                          {catalogoAtual.map((item) => (
                            <option
                              key={item.id}
                              value={item.id}
                              disabled={
                                novoItemTipo === "PECA" &&
                                Number(item.qtdEstoque ?? 0) <= 0
                              }
                            >
                              {item.descricao} — {moeda(item.valorUni)}
                              {novoItemTipo === "PECA"
                                ? ` (estoque: ${item.qtdEstoque ?? 0})`
                                : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="gf-item-campo">
                        <label htmlFor="gf-qtd-item">Quantidade</label>
                        <input
                          id="gf-qtd-item"
                          type="number"
                          min="1"
                          step="1"
                          value={novoItemQtd}
                          disabled={ocupado}
                          onChange={(e) => {
                            setNovoItemQtd(e.target.value);
                            setFeedbackItem(null);
                          }}
                        />
                      </div>
                    </div>

                    {itemSelecionado && (
                      <div className="gf-item-previsao">
                        <div>
                          <span>Valor unitário</span>
                          <strong>{moeda(itemSelecionado.valorUni)}</strong>
                        </div>

                        {novoItemTipo === "PECA" && (
                          <div>
                            <span>Estoque disponível</span>
                            <strong>{itemSelecionado.qtdEstoque ?? 0}</strong>
                          </div>
                        )}

                        <div>
                          <span>Subtotal previsto</span>
                          <strong>
                            {moeda(
                              quantidadeValida
                                ? Number(itemSelecionado.valorUni) *
                                    quantidadeNumerica
                                : 0,
                            )}
                          </strong>
                        </div>
                      </div>
                    )}

                    {itemSelecionado && !estoqueDisponivel && (
                      <Aviso>Quantidade maior que o estoque disponível.</Aviso>
                    )}

                    {feedbackItem && (
                      <Aviso tipo={feedbackItem.tipo}>
                        {feedbackItem.texto}
                      </Aviso>
                    )}

                    <button
                      type="button"
                      className="gf-btn-adicionar-item"
                      disabled={!podeAdicionar}
                      onClick={adicionarItem}
                    >
                      {adicionandoItem
                        ? "Adicionando item..."
                        : "+ Incluir no orçamento"}
                    </button>
                  </div>
                )}
              </section>

              <section className="gf-orcamento">
                <div className="gf-orcamento-header">
                  <div>
                    <span className="gf-orcamento-eyebrow">
                      RF09 · REVISÃO FINANCEIRA
                    </span>
                    <h3>Resumo do orçamento</h3>
                    <p>
                      Confira os valores antes de encaminhar o orçamento ao
                      cliente.
                    </p>
                  </div>

                  <div className="gf-orcamento-icon">R$</div>
                </div>

                <div className="gf-orcamento-resumo">
                  <div className="gf-orcamento-linha">
                    <span>Subtotal de peças e serviços</span>
                    <strong>{moeda(valorBruto)}</strong>
                  </div>

                  <div className="gf-orcamento-linha">
                    <span>Desconto</span>
                    <strong className="gf-orcamento-desconto">
                      −{" "}
                      {moeda(
                        emAnalise
                          ? descontoValido
                            ? descontoNumerico
                            : 0
                          : osDetalhe.desconto,
                      )}
                    </strong>
                  </div>

                  <div className="gf-orcamento-total">
                    <div>
                      <span>VALOR FINAL</span>
                      <small>
                        {emAnalise
                          ? "Prévia em tempo real"
                          : "Valor registrado"}
                      </small>
                    </div>

                    <strong>
                      {moeda(emAnalise ? valorFinal : osDetalhe.valorFinal)}
                    </strong>
                  </div>
                </div>

                {emAnalise && (
                  <div className="gf-orcamento-edicao">
                    <label htmlFor="gf-desconto">Aplicar desconto</label>
                    <p>
                      Informe o desconto em reais, com até duas casas decimais.
                    </p>

                    <div className="gf-desconto-input-wrapper">
                      <span>R$</span>
                      <input
                        id="gf-desconto"
                        type="number"
                        min="0"
                        max={valorBruto}
                        step="0.01"
                        value={desconto}
                        disabled={ocupado}
                        onChange={(e) => {
                          setDesconto(e.target.value);
                          setFeedbackOrcamento(null);
                        }}
                      />
                    </div>

                    {!descontoValido && (
                      <span className="gf-desconto-aviso">
                        Informe um valor entre R$ 0,00 e {moeda(valorBruto)}.
                      </span>
                    )}
                  </div>
                )}

                {feedbackOrcamento && (
                  <Aviso tipo={feedbackOrcamento.tipo}>
                    {feedbackOrcamento.texto}
                  </Aviso>
                )}

                {emAnalise ? (
                  <button
                    type="button"
                    className="gf-btn-fechar-orcamento"
                    disabled={
                      ocupado || !descontoValido || itensOS.length === 0
                    }
                    onClick={fecharRascunho}
                  >
                    {fechandoRascunho
                      ? "Fechando orçamento..."
                      : "Confirmar fechamento do orçamento"}
                  </button>
                ) : (
                  <div className="gf-orcamento-bloqueado">
                    {osDetalhe.statusOperac === "AGUARDANDO_APROVACAO"
                      ? "Orçamento fechado. Aguardando aprovação do cliente."
                      : osDetalhe.statusOperac === "ORCAMENTO_REJEITADO"
                        ? "Orçamento rejeitado pelo cliente."
                        : osDetalhe.statusOperac === "EM_EXECUCAO"
                          ? "Orçamento aprovado. Serviço em execução."
                          : "O fechamento está disponível apenas para ordens em análise."}
                  </div>
                )}
              </section>

              <footer className="gf-os-footer">
                {osDetalhe.statusOperac === "EM_EXECUCAO" && (
                  <button type="button" className="gf-btn-fechar-orcamento"
                    onClick={finalizarOS} disabled={ocupado}>
                    {finalizandoOS ? "Finalizando..." : "Finalizar ordem de serviço"}
                  </button>
                )}
                <button
                  type="button"
                  className="gf-btn-voltar"
                  onClick={fecharDetalhes}
                  disabled={ocupado}
                >
                  Fechar detalhes
                </button>
              </footer>
            </div>
          </div>,
          document.body,
        )}

      {modalNovaOS &&
        createPortal(
          <div
            className="modal-overlay gf-overlay"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget && !salvandoOS) {
                setModalNovaOS(false);
              }
            }}
          >
            <div
              className="modal-content gf-os-modal gf-nova-os-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="gf-titulo-nova-os"
            >
              <header className="gf-modal-cabecalho">
                <div>
                  <span className="gf-os-eyebrow">NOVO ATENDIMENTO</span>
                  <h2 id="gf-titulo-nova-os">Abrir Ordem de Serviço</h2>
                  <p>Preencha os dados para registrar o atendimento.</p>
                </div>

                <button
                  type="button"
                  className="gf-modal-fechar"
                  disabled={salvandoOS}
                  onClick={() => setModalNovaOS(false)}
                  aria-label="Fechar formulário"
                >
                  ×
                </button>
              </header>

              <form onSubmit={criarOS} className="gf-form-nova-os">
                <div className="gf-form-campo gf-form-largo">
                  <label htmlFor="gf-veiculo">Veículo cadastrado</label>
                  <select
                    id="gf-veiculo"
                    required
                    value={formData.veiculoId}
                    onChange={(e) =>
                      setFormData((anterior) => ({
                        ...anterior,
                        veiculoId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Selecione o veículo...</option>
                    {veiculos.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.placa} — {v.marca} {v.modelo}
                        {v.cliente?.nome ? ` (${v.cliente.nome})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="gf-form-campo gf-form-largo">
                  <label htmlFor="gf-mecanico">Mecânico responsável</label>
                  <select
                    id="gf-mecanico"
                    required
                    value={formData.funcionarioId}
                    onChange={(e) =>
                      setFormData((anterior) => ({
                        ...anterior,
                        funcionarioId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Selecione o profissional...</option>
                    {funcionarios.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nome} — {f.cargo || "Mecânico"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="gf-form-campo">
                  <label htmlFor="gf-prioridade-nova">Prioridade</label>
                  <select
                    id="gf-prioridade-nova"
                    value={formData.prioridade}
                    onChange={(e) =>
                      setFormData((anterior) => ({
                        ...anterior,
                        prioridade: e.target.value,
                      }))
                    }
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="ALTA">Alta</option>
                    <option value="URGENTE">Urgente</option>
                  </select>
                </div>

                <div className="gf-form-campo">
                  <label htmlFor="gf-data-entrada">Data de entrada</label>
                  <input
                    id="gf-data-entrada"
                    type="date"
                    required
                    value={formData.dataEntrada}
                    onChange={(e) =>
                      setFormData((anterior) => ({
                        ...anterior,
                        dataEntrada: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="gf-form-campo">
                  <label htmlFor="gf-previsao">Previsão de entrega</label>
                  <input
                    id="gf-previsao"
                    type="date"
                    required
                    min={formData.dataEntrada}
                    value={formData.previsaoEntrega}
                    onChange={(e) =>
                      setFormData((anterior) => ({
                        ...anterior,
                        previsaoEntrega: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="gf-form-campo gf-form-largo">
                  <label htmlFor="gf-diagnostico">
                    Relato do cliente / diagnóstico inicial
                  </label>
                  <textarea
                    id="gf-diagnostico"
                    rows="4"
                    placeholder="Descreva o problema relatado..."
                    value={formData.obsDiag}
                    onChange={(e) =>
                      setFormData((anterior) => ({
                        ...anterior,
                        obsDiag: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="gf-form-largo">
                  <Aviso>{feedbackNovaOS}</Aviso>
                </div>

                <div className="gf-form-acoes gf-form-largo">
                  <button
                    type="button"
                    className="gf-btn-secundario"
                    disabled={salvandoOS}
                    onClick={() => setModalNovaOS(false)}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="gf-btn-primario"
                    disabled={salvandoOS}
                  >
                    {salvandoOS ? "Criando ordem..." : "Criar Ordem de Serviço"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </main>
  );
}
