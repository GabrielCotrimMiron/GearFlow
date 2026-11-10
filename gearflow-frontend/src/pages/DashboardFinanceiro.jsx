import { useCallback, useEffect, useMemo, useState } from "react";
import { gerarAutorizacaoBasica } from "../services/clienteAuth";
import "./DashboardFinanceiro.css";

const API = "http://localhost:8080";

const dinheiro = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);

const numero = (valor) => new Intl.NumberFormat("pt-BR").format(valor || 0);

const dataBR = (data) => {
  if (!data) return "Não informada";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
};

const meses = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

function Icone({ nome, size = 20 }) {
  const caminhos = {
    receita: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <path d="m7 15 4-4 3 3 4-5" />
      </>
    ),
    pago: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    pendente: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    estorno: (
      <>
        <path d="M4 7v5h5" />
        <path d="M5 12a7 7 0 1 1 2 5" />
      </>
    ),
    atualizar: (
      <>
        <path d="M20 11a8 8 0 0 0-14-5L4 8" />
        <path d="M4 4v4h4" />
        <path d="M4 13a8 8 0 0 0 14 5l2-2" />
        <path d="M20 20v-4h-4" />
      </>
    ),
    baixar: (
      <>
        <path d="M12 3v12m-4-4 4 4 4-4" />
        <path d="M4 17v4h16v-4" />
      </>
    ),
    busca: (
      <>
        <circle cx="10" cy="10" r="6" />
        <path d="m15 15 5 5" />
      </>
    ),
    calendario: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4m10-4v4M3 10h18" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {caminhos[nome]}
    </svg>
  );
}

function Cartao({ titulo, valor, detalhe, icone, cor }) {
  return (
    <article className={`fin-kpi fin-kpi-${cor}`}>
      <div className="fin-kpi-top">
        <span>{titulo}</span>
        <span className="fin-kpi-icon">
          <Icone nome={icone} />
        </span>
      </div>
      <strong>{valor}</strong>
      <p>{detalhe}</p>
    </article>
  );
}

function GraficoMensal({ dados, tipo }) {
  const maximo = Math.max(1, ...dados.map((item) => item.pago + item.pendente));

  return (
    <div className="fin-chart">
      {dados.map((item) => {
        const pago = (item.pago / maximo) * 100;
        const pendente = (item.pendente / maximo) * 100;

        return (
          <div className="fin-chart-column" key={item.chave}>
            <div className="fin-chart-bars">
              {tipo === "comparativo" ? (
                <>
                  <div
                    className="fin-bar fin-bar-paid"
                    style={{ height: `${pago}%` }}
                    title={`${item.mes}: pagos ${dinheiro(item.pago)}`}
                  />
                  <div
                    className="fin-bar fin-bar-pending"
                    style={{ height: `${pendente}%` }}
                    title={`${item.mes}: pendentes ${dinheiro(item.pendente)}`}
                  />
                </>
              ) : (
                <div
                  className="fin-bar fin-bar-paid"
                  style={{
                    height: `${((item.pago + item.pendente) / maximo) * 100}%`,
                  }}
                  title={`${item.mes}: ${dinheiro(item.pago + item.pendente)}`}
                />
              )}
            </div>
            <span>{item.mes}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardFinanceiro() {
  const [resumo, setResumo] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [atualizadoEm, setAtualizadoEm] = useState(null);
  const [periodo, setPeriodo] = useState("12");
  const [situacao, setSituacao] = useState("TODOS");
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [tipoGrafico, setTipoGrafico] = useState("comparativo");
  const [processandoOS, setProcessandoOS] = useState(null);
  const [mensagem, setMensagem] = useState("");

  const [resultadoFinanceiro, setResultadoFinanceiro] = useState(null);
  const [despesas, setDespesas] = useState([]);
  const [mostrarFormularioDespesa, setMostrarFormularioDespesa] =
    useState(false);
  const [salvandoDespesa, setSalvandoDespesa] = useState(false);

  const [novaDespesa, setNovaDespesa] = useState({
    descricao: "",
    valor: "",
    data: new Date().toLocaleDateString("en-CA"),
  });

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const authorization = gerarAutorizacaoBasica();

      if (!authorization) {
        throw new Error("Sessão não encontrada. Entre novamente no sistema.");
      }

      const opcoes = {
        headers: { Authorization: authorization },
        cache: "no-store",
      };

      const [resResumo, resHistorico, resResultado, resDespesas] =
        await Promise.all([
          fetch(`${API}/financeiro/resumo`, opcoes),
          fetch(`${API}/financeiro/historico`, opcoes),
          fetch(`${API}/financeiro/resultado`, opcoes),
          fetch(`${API}/financeiro/despesas`, opcoes),
        ]);

      if (
        !resResumo.ok ||
        !resHistorico.ok ||
        !resResultado.ok ||
        !resDespesas.ok
      ) {
        const status = [
          resResumo,
          resHistorico,
          resResultado,
          resDespesas,
        ].find((resposta) => !resposta.ok).status;

        if (status === 401 || status === 403) {
          throw new Error("Acesso não autorizado ao painel financeiro.");
        }

        throw new Error(`Falha ao consultar os dados. HTTP ${status}`);
      }

      const [dadosResumo, dadosHistorico, dadosResultado, dadosDespesas] =
        await Promise.all([
          resResumo.json(),
          resHistorico.json(),
          resResultado.json(),
          resDespesas.json(),
        ]);

      setResumo(dadosResumo);
      setHistorico(Array.isArray(dadosHistorico) ? dadosHistorico : []);
      setResultadoFinanceiro(dadosResultado);
      setDespesas(Array.isArray(dadosDespesas) ? dadosDespesas : []);
      setAtualizadoEm(new Date());
    } catch (e) {
      setErro(e.message || "Não foi possível carregar os dados.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    const iniciarCarregamento = async () => {
      await carregar();
    };

    const agendamento = setTimeout(() => {
      void iniciarCarregamento();
    }, 0);

    return () => clearTimeout(agendamento);
  }, [carregar]);

  const ordensPeriodo = useMemo(() => {
    const hoje = new Date();
    const limite = new Date(
      hoje.getFullYear(),
      hoje.getMonth() - Number(periodo) + 1,
      1,
    );

    return historico.filter((os) => {
      if (!os.dataEntrada) return false;
      const data = new Date(`${os.dataEntrada}T12:00:00`);
      return data >= limite && data <= hoje;
    });
  }, [historico, periodo]);

  const indicadores = useMemo(() => {
    const resultado = {
      faturamento: 0,
      pago: 0,
      pendente: 0,
      estornado: 0,
      quantidade: ordensPeriodo.length,
    };

    for (const os of ordensPeriodo) {
      const valor = Number(os.valor) || 0;
      resultado.faturamento += valor;

      if (os.statusPagamento === "PAGO") {
        resultado.pago += valor;
      } else if (os.statusPagamento === "ESTORNADO") {
        resultado.estornado += valor;
      } else {
        resultado.pendente += valor;
      }
    }

    return resultado;
  }, [ordensPeriodo]);

  const dadosMensais = useMemo(() => {
    const hoje = new Date();
    const totalMeses = Number(periodo);

    const lista = Array.from({ length: totalMeses }, (_, indice) => {
      const data = new Date(
        hoje.getFullYear(),
        hoje.getMonth() - totalMeses + indice + 1,
        1,
      );

      return {
        chave: `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(
          2,
          "0",
        )}`,
        mes: meses[data.getMonth()],
        pago: 0,
        pendente: 0,
      };
    });

    const mapa = new Map(lista.map((item) => [item.chave, item]));

    ordensPeriodo.forEach((os) => {
      const chave = os.dataEntrada?.slice(0, 7);
      const item = mapa.get(chave);
      if (!item) return;

      const valor = Number(os.valor) || 0;

      if (os.statusPagamento === "PAGO") {
        item.pago += valor;
      } else if (os.statusPagamento !== "ESTORNADO") {
        item.pendente += valor;
      }
    });

    return lista;
  }, [ordensPeriodo, periodo]);

  const ordensFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return ordensPeriodo.filter((os) => {
      const correspondeStatus =
        situacao === "TODOS" || os.statusPagamento === situacao;

      const correspondeBusca =
        !termo || String(os.id).toLowerCase().includes(termo);

      return correspondeStatus && correspondeBusca;
    });
  }, [ordensPeriodo, situacao, busca]);

  const totalPaginas = Math.max(1, Math.ceil(ordensFiltradas.length / 8));

  const paginaAtual = Math.min(pagina, totalPaginas);

  const ordensPagina = ordensFiltradas.slice(
    (paginaAtual - 1) * 8,
    paginaAtual * 8,
  );

  const percentualPago =
    indicadores.faturamento > 0
      ? (indicadores.pago / indicadores.faturamento) * 100
      : 0;

  async function alterarPagamento(os, acao) {
    const descricao =
      acao === "pagar" ? "marcar como paga" : "registrar o estorno de";

    if (!window.confirm(`Deseja ${descricao} a OS #${os.id}?`)) {
      return;
    }

    setProcessandoOS(os.id);
    setMensagem("");

    try {
      const authorization = gerarAutorizacaoBasica();

      if (!authorization) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      const resposta = await fetch(
        `${API}/financeiro/ordens/${os.id}/${acao}`,
        {
          method: "PUT",
          headers: {
            Authorization: authorization,
          },
        },
      );

      if (!resposta.ok) {
        throw new Error(
          `Não foi possível realizar a operação. HTTP ${resposta.status}`,
        );
      }

      await carregar();

      setMensagem(
        acao === "pagar"
          ? `Pagamento da OS #${os.id} registrado com sucesso!`
          : `Estorno da OS #${os.id} registrado com sucesso!`,
      );
    } catch (erroOperacao) {
      setMensagem(erroOperacao.message || "Erro ao atualizar pagamento.");
    } finally {
      setProcessandoOS(null);
    }
  }

  async function cadastrarDespesa(evento) {
    evento.preventDefault();

    const descricao = novaDespesa.descricao.trim();
    const valor = Number(novaDespesa.valor);

    if (!descricao || !Number.isFinite(valor) || valor <= 0) {
      setMensagem("Informe uma descrição e um valor válido.");
      return;
    }

    setSalvandoDespesa(true);
    setMensagem("");

    try {
      const authorization = gerarAutorizacaoBasica();

      if (!authorization) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      const resposta = await fetch(`${API}/financeiro/despesas`, {
        method: "POST",
        headers: {
          Authorization: authorization,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          descricao,
          valor,
          data: novaDespesa.data || null,
        }),
      });

      if (!resposta.ok) {
        throw new Error(
          `Não foi possível cadastrar a despesa. HTTP ${resposta.status}`,
        );
      }

      await carregar();

      setNovaDespesa({
        descricao: "",
        valor: "",
        data: new Date().toLocaleDateString("en-CA"),
      });

      setMostrarFormularioDespesa(false);
      setMensagem("Despesa cadastrada com sucesso!");
    } catch (erroCadastro) {
      setMensagem(erroCadastro.message || "Erro ao cadastrar despesa.");
    } finally {
      setSalvandoDespesa(false);
    }
  }

  function exportarCSV() {
    const linhas = [
      ["OS", "Data de entrada", "Status", "Pagamento", "Valor"],
      ...ordensFiltradas.map((os) => [
        os.id,
        os.dataEntrada || "",
        os.statusOperacional,
        os.statusPagamento,
        Number(os.valor || 0).toFixed(2),
      ]),
    ];

    const conteudo =
      "\uFEFF" +
      linhas
        .map((linha) =>
          linha
            .map((campo) => `"${String(campo ?? "").replaceAll('"', '""')}"`)
            .join(";"),
        )
        .join("\r\n");

    const blob = new Blob([conteudo], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "gearflow-relatorio-financeiro.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fin-dashboard">
      <div className="fin-toolbar">
        <div className="fin-toolbar-title">
          <span className="fin-live">
            <span className="fin-live-dot" />
            Dados do sistema
          </span>
          <h2>Visão financeira</h2>
          <p>
            Acompanhe os resultados das ordens finalizadas e os valores
            registrados.
          </p>
        </div>

        <div className="fin-toolbar-actions">
          <label className="fin-period">
            <Icone nome="calendario" size={17} />
            <select
              value={periodo}
              onChange={(e) => {
                setPeriodo(e.target.value);
                setPagina(1);
              }}
            >
              <option value="3">Últimos 3 meses</option>
              <option value="6">Últimos 6 meses</option>
              <option value="12">Últimos 12 meses</option>
              <option value="24">Últimos 24 meses</option>
            </select>
          </label>

          <button
            className="fin-button fin-button-outline"
            onClick={carregar}
            disabled={carregando}
          >
            <Icone nome="atualizar" size={17} />
            Atualizar
          </button>

          <button
            className="fin-button fin-button-primary"
            onClick={exportarCSV}
            disabled={carregando || !ordensFiltradas.length || !!erro}
          >
            <Icone nome="baixar" size={17} />
            Exportar CSV
          </button>
        </div>
      </div>

      {erro && (
        <div className="fin-error" role="alert">
          {erro}
          <button onClick={carregar}>Tentar novamente</button>
        </div>
      )}

      {carregando && !resumo ? (
        <div className="fin-loading">Carregando dados financeiros...</div>
      ) : (
        <>
          {mensagem && (
            <div className="fin-feedback" role="status">
              {mensagem}
              <button
                type="button"
                onClick={() => setMensagem("")}
                aria-label="Fechar mensagem"
              >
                ×
              </button>
            </div>
          )}

          <section className="fin-profit-section">
            <div className="fin-profit-info">
              <span className="fin-profit-label">RESULTADO FINANCEIRO</span>

              <h2>{dinheiro(resultadoFinanceiro?.lucroEstimado ?? 0)}</h2>

              <p>Lucro estimado da oficina</p>

              <div className="fin-profit-details">
                <span>
                  Recebido:{" "}
                  <strong>
                    {dinheiro(resultadoFinanceiro?.totalRecebido ?? 0)}
                  </strong>
                </span>

                <span>
                  Despesas:{" "}
                  <strong>
                    {dinheiro(resultadoFinanceiro?.totalDespesas ?? 0)}
                  </strong>
                </span>
              </div>
            </div>

            <button
              type="button"
              className="fin-add-expense"
              onClick={() => setMostrarFormularioDespesa((atual) => !atual)}
            >
              {mostrarFormularioDespesa
                ? "Fechar formulário"
                : "+ Cadastrar despesa"}
            </button>
          </section>

          {mostrarFormularioDespesa && (
            <form className="fin-expense-form" onSubmit={cadastrarDespesa}>
              <h3>Nova despesa</h3>

              <div className="fin-expense-fields">
                <label>
                  Descrição
                  <input
                    type="text"
                    placeholder="Ex.: Conta de energia"
                    maxLength={150}
                    required
                    value={novaDespesa.descricao}
                    onChange={(e) =>
                      setNovaDespesa((atual) => ({
                        ...atual,
                        descricao: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Valor (R$)
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0,00"
                    required
                    value={novaDespesa.valor}
                    onChange={(e) =>
                      setNovaDespesa((atual) => ({
                        ...atual,
                        valor: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Data
                  <input
                    type="date"
                    required
                    value={novaDespesa.data}
                    onChange={(e) =>
                      setNovaDespesa((atual) => ({
                        ...atual,
                        data: e.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <button
                type="submit"
                className="fin-save-expense"
                disabled={salvandoDespesa}
              >
                {salvandoDespesa ? "Salvando..." : "Salvar despesa"}
              </button>
            </form>
          )}

          <div className="fin-kpi-grid">
            <Cartao
              titulo="Faturamento finalizado"
              valor={dinheiro(indicadores.faturamento)}
              detalhe={`${numero(indicadores.quantidade)} ordens no período`}
              icone="receita"
              cor="blue"
            />
            <Cartao
              titulo="Valores pagos"
              valor={dinheiro(indicadores.pago)}
              detalhe={`${percentualPago.toFixed(1)}% do faturamento`}
              icone="pago"
              cor="green"
            />
            <Cartao
              titulo="A receber"
              valor={dinheiro(indicadores.pendente)}
              detalhe="OS finalizadas pendentes"
              icone="pendente"
              cor="orange"
            />
            <Cartao
              titulo="Valores estornados"
              valor={dinheiro(indicadores.estornado)}
              detalhe="OS marcadas como estornadas"
              icone="estorno"
              cor="red"
            />
          </div>

          <section className="fin-expense-history">
            <div className="fin-expense-history-header">
              <h3>Despesas cadastradas</h3>
              <span>{despesas.length} registro(s)</span>
            </div>

            {despesas.length === 0 ? (
              <p className="fin-expense-empty">Nenhuma despesa cadastrada.</p>
            ) : (
              <div className="fin-expense-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Descrição</th>
                      <th>Data</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...despesas]
                      .sort((a, b) =>
                        (b.data || "").localeCompare(a.data || ""),
                      )
                      .map((despesa) => (
                        <tr key={despesa.id}>
                          <td>{despesa.descricao}</td>
                          <td>{dataBR(despesa.data)}</td>
                          <td>{dinheiro(despesa.valor)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="fin-panels">
            <section className="fin-panel fin-main-chart">
              <div className="fin-panel-header">
                <div>
                  <span className="fin-section-eyebrow">DESEMPENHO</span>
                  <h3>Evolução financeira</h3>
                  <p>Valores agrupados pela data de entrada da OS.</p>
                </div>

                <select
                  className="fin-select"
                  value={tipoGrafico}
                  onChange={(e) => setTipoGrafico(e.target.value)}
                >
                  <option value="comparativo">Pago × Pendente</option>
                  <option value="total">Total não estornado</option>
                </select>
              </div>

              <div className="fin-chart-legend">
                <span>
                  <i className="fin-dot-paid" /> Pago
                </span>
                {tipoGrafico === "comparativo" && (
                  <span>
                    <i className="fin-dot-pending" /> Pendente
                  </span>
                )}
              </div>

              <GraficoMensal dados={dadosMensais} tipo={tipoGrafico} />
            </section>

            <section className="fin-panel fin-distribution">
              <div className="fin-panel-header">
                <div>
                  <span className="fin-section-eyebrow">RECEBIMENTOS</span>
                  <h3>Distribuição</h3>
                  <p>Situação dos valores das OS.</p>
                </div>
              </div>

              <div
                className="fin-donut"
                style={{
                  "--fin-pago": `${percentualPago}%`,
                  "--fin-pendente": `${
                    indicadores.faturamento > 0
                      ? ((indicadores.pago + indicadores.pendente) /
                          indicadores.faturamento) *
                        100
                      : 0
                  }%`,
                }}
              >
                <div className="fin-donut-inner">
                  <span>Recebido</span>
                  <strong>{percentualPago.toFixed(1)}%</strong>
                </div>
              </div>

              <div className="fin-distribution-list">
                <div>
                  <span>
                    <i className="fin-dot-paid" /> Pago
                  </span>
                  <strong>{dinheiro(indicadores.pago)}</strong>
                </div>
                <div>
                  <span>
                    <i className="fin-dot-pending" /> Pendente
                  </span>
                  <strong>{dinheiro(indicadores.pendente)}</strong>
                </div>
                <div>
                  <span>
                    <i className="fin-dot-refund" /> Estornado
                  </span>
                  <strong>{dinheiro(indicadores.estornado)}</strong>
                </div>
              </div>
            </section>
          </div>

          <section className="fin-panel fin-history">
            <div className="fin-panel-header fin-history-header">
              <div>
                <span className="fin-section-eyebrow">MOVIMENTAÇÃO</span>
                <h3>Histórico de ordens finalizadas</h3>
                <p>{numero(ordensFiltradas.length)} registros encontrados</p>
              </div>

              <div className="fin-history-filters">
                <label className="fin-search">
                  <Icone nome="busca" size={17} />
                  <input
                    value={busca}
                    placeholder="Buscar número da OS..."
                    onChange={(e) => {
                      setBusca(e.target.value);
                      setPagina(1);
                    }}
                  />
                </label>

                <select
                  className="fin-select"
                  value={situacao}
                  onChange={(e) => {
                    setSituacao(e.target.value);
                    setPagina(1);
                  }}
                >
                  <option value="TODOS">Todos os pagamentos</option>
                  <option value="PAGO">Pagos</option>
                  <option value="PENDENTE">Pendentes</option>
                  <option value="ESTORNADO">Estornados</option>
                </select>
              </div>
            </div>

            <div className="fin-table-scroll">
              <table className="fin-table">
                <thead>
                  <tr>
                    <th>Ordem</th>
                    <th>Data de entrada</th>
                    <th>Situação operacional</th>
                    <th>Pagamento</th>
                    <th>Valor</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {ordensPagina.map((os) => (
                    <tr key={os.id}>
                      <td>
                        <strong>#{os.id}</strong>
                      </td>
                      <td>{dataBR(os.dataEntrada)}</td>
                      <td>Finalizada</td>
                      <td>
                        <span
                          className={`fin-status fin-status-${os.statusPagamento.toLowerCase()}`}
                        >
                          {os.statusPagamento === "PAGO"
                            ? "Pago"
                            : os.statusPagamento === "ESTORNADO"
                              ? "Estornado"
                              : "Pendente"}
                        </span>
                      </td>
                      <td className="fin-value">{dinheiro(os.valor)}</td>

                      <td>
                        {os.statusPagamento === "PENDENTE" && (
                          <button
                            type="button"
                            className="fin-action fin-action-pay"
                            disabled={processandoOS === os.id}
                            onClick={() => alterarPagamento(os, "pagar")}
                          >
                            {processandoOS === os.id
                              ? "Aguarde..."
                              : "Marcar como pago"}
                          </button>
                        )}

                        {os.statusPagamento === "PAGO" && (
                          <button
                            type="button"
                            className="fin-action fin-action-refund"
                            disabled={processandoOS === os.id}
                            onClick={() => alterarPagamento(os, "estornar")}
                          >
                            {processandoOS === os.id
                              ? "Aguarde..."
                              : "Estornar"}
                          </button>
                        )}

                        {os.statusPagamento === "ESTORNADO" && (
                          <span className="fin-action-done">Estornado</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {!ordensPagina.length && (
                    <tr>
                      <td colSpan="6" className="fin-empty">
                        Nenhuma ordem encontrada para os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="fin-table-footer">
              <span>
                Página {paginaAtual} de {totalPaginas}
              </span>
              <div>
                <button
                  disabled={paginaAtual === 1}
                  onClick={() => setPagina(paginaAtual - 1)}
                >
                  Anterior
                </button>
                <button
                  disabled={paginaAtual === totalPaginas}
                  onClick={() => setPagina(paginaAtual + 1)}
                >
                  Próxima
                </button>
              </div>
            </div>
          </section>

          <div className="fin-bottom">
            <span>
              {atualizadoEm
                ? `Atualizado às ${atualizadoEm.toLocaleTimeString("pt-BR")}`
                : "Aguardando atualização"}
            </span>
            <span>
              Dados por data de entrada da OS • Não representa lucro líquido nem
              fluxo de caixa efetivo.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
