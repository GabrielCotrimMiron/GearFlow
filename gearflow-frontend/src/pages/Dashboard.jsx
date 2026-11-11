import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

import "./Dashboard.css";

const API = "/api";
const MESES = [
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
const moeda = (valor) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(valor) || 0,
  );
const lista = (valor) =>
  Array.isArray(valor)
    ? valor
    : Array.isArray(valor?.content)
      ? valor.content
      : [];
const atalhos = [
  {
    titulo: "Dashboard financeiro",
    descricao: "Receitas, despesas e pagamentos",
    caminho: "/financeiro",
    icone: "◈",
  },
  {
    titulo: "Ordens de serviço",
    descricao: "Acompanhar atendimentos",
    caminho: "/ordens-servico",
    icone: "▤",
  },
  {
    titulo: "Gestão de peças",
    descricao: "Estoque e disponibilidade",
    caminho: "/pecas",
    icone: "▦",
  },
  {
    titulo: "Catálogo de serviços",
    descricao: "Serviços oferecidos",
    caminho: "/servicos",
    icone: "⚙",
  },
  {
    titulo: "Gestão de equipe",
    descricao: "Colaboradores da oficina",
    caminho: "/equipe",
    icone: "♙",
  },
];

async function buscarFinanceiro(caminho) {
  const resposta = await fetch(`${API}${caminho}`, { credentials: "same-origin",
    headers: { "X-Client": "GearFlow" },
    cache: "no-store",
  });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return resposta.json();
}

function Grafico({ historico, periodo }) {
  const meses = useMemo(() => {
    const agora = new Date();
    const dados = Array.from({ length: periodo }, (_, i) => {
      const data = new Date(
        agora.getFullYear(),
        agora.getMonth() - periodo + i + 1,
        1,
      );
      return {
        chave: `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`,
        rotulo: `${MESES[data.getMonth()]}/${String(data.getFullYear()).slice(2)}`,
        pago: 0,
        pendente: 0,
      };
    });
    const porMes = new Map(dados.map((item) => [item.chave, item]));
    historico.forEach((os) => {
      const mes = porMes.get(os.dataEntrada?.slice(0, 7));
      if (!mes) return;
      const valor = Number(os.valor) || 0;
      if (os.statusPagamento === "PAGO") mes.pago += valor;
      if (os.statusPagamento === "PENDENTE") mes.pendente += valor;
    });
    return dados;
  }, [historico, periodo]);
  const maior = Math.max(1, ...meses.map((mes) => mes.pago + mes.pendente));
  return (
    <div
      className="dashboard-grafico"
      role="img"
      aria-label="Valores pagos e pendentes por mês, agrupados pela data de entrada da ordem de serviço"
    >
      {meses.map((mes) => (
        <div
          className="dashboard-grafico-coluna"
          key={mes.chave}
          title={`${mes.rotulo}: pago ${moeda(mes.pago)}; pendente ${moeda(mes.pendente)}`}
        >
          <div className="dashboard-grafico-barras">
            <span
              className="dashboard-barra-pago"
              style={{ height: `${(mes.pago / maior) * 100}%` }}
            />
            <span
              className="dashboard-barra-pendente"
              style={{ height: `${(mes.pendente / maior) * 100}%` }}
            />
          </div>
          <small>{mes.rotulo}</small>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [dados, setDados] = useState({
    historico: [],
    resultado: null,
    despesas: [],
    pecas: [],
    servicos: [],
    funcionarios: [],
  });
  const [falhas, setFalhas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [atualizadoEm, setAtualizadoEm] = useState(null);
  const [periodo, setPeriodo] = useState(6);
  const [clientesAdmin, setClientesAdmin] = useState(null);

  const carregarDados = useCallback(async (atualizacao = false) => {
    if (atualizacao) setAtualizando(true);
    else setCarregando(true);

    const tarefas = [
      [
        "historico",
        "Histórico financeiro",
        () => buscarFinanceiro("/financeiro/historico"),
      ],
      [
        "resultado",
        "Resultado financeiro",
        () => buscarFinanceiro("/financeiro/resultado"),
      ],
      [
        "despesas",
        "Despesas",
        () => buscarFinanceiro("/financeiro/despesas"),
      ],
      ["pecas", "Peças", () => api.get("/pecas").then((r) => r.data)],
      ["servicos", "Serviços", () => api.get("/servicos").then((r) => r.data)],
      [
        "funcionarios",
        "Colaboradores",
        () => api.get("/funcionarios").then((r) => r.data),
      ],
    ];
    try {
      const resultados = await Promise.allSettled(tarefas.map((t) => t[2]()));
      const erros = [];
      const proximos = {};
      resultados.forEach((r, i) => {
        const [chave, titulo] = tarefas[i];
        if (r.status === "fulfilled")
          proximos[chave] = chave === "resultado" ? r.value : lista(r.value);
        else {
          erros.push(titulo);
          console.error(`Erro ao consultar ${titulo}:`, r.reason);
          proximos[chave] = chave === "resultado" ? null : [];
        }
      });
      setDados(proximos);
      setFalhas(erros);
      setAtualizadoEm(new Date());
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    api.get("/admin/clientes")
      .then(({ data }) => {
        if (!ativo) return;
        const clientes = lista(data);
        setClientesAdmin(clientes.length);
      })
      .catch(() => {
        if (ativo) setClientesAdmin(null);
      });
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    const agendamento = setTimeout(() => {
      void carregarDados();
    }, 0);

    return () => clearTimeout(agendamento);
  }, [carregarDados]);

  const historico = dados.historico;
  const recebido = Number(dados.resultado?.totalRecebido) || 0;
  const despesasTotal = Number(dados.resultado?.totalDespesas) || 0;
  const lucro = Number(dados.resultado?.lucroEstimado) || 0;
  const pendentes = historico.filter((os) => os.statusPagamento === "PENDENTE");
  const totalPendente = pendentes.reduce(
    (s, os) => s + (Number(os.valor) || 0),
    0,
  );
  const pagos = historico.filter((os) => os.statusPagamento === "PAGO").length;
  const estornados = historico.filter(
    (os) => os.statusPagamento === "ESTORNADO",
  ).length;
  const pecasBaixas = dados.pecas.filter(
    (p) =>
      p.estoqueBaixo === true ||
      (p.estoqueBaixo == null && Number(p.qtdEstoque ?? 0) <= 5),
  ).length;
  const estoqueValor = dados.pecas.reduce(
    (s, p) => s + (Number(p.valorUni) || 0) * (Number(p.qtdEstoque) || 0),
    0,
  );
  const falhou = (nome) => falhas.includes(nome);
  const valorOuTraco = (valor, erro) => (carregando || erro ? "—" : valor);

  const kpis = [
    {
      nome: "Recebido",
      valor: valorOuTraco(moeda(recebido), falhou("Resultado financeiro")),
      descricao: "OS pagas · acumulado",
      cor: "verde",
      icone: "↗",
    },
    {
      nome: "Despesas",
      valor: valorOuTraco(moeda(despesasTotal), falhou("Resultado financeiro")),
      descricao: "Despesas registradas · acumulado",
      cor: "laranja",
      icone: "↘",
    },
    {
      nome: "Lucro estimado",
      valor: valorOuTraco(moeda(lucro), falhou("Resultado financeiro")),
      descricao: "Recebido menos despesas",
      cor: "azul",
      icone: "◈",
    },
    {
      nome: "A receber",
      valor: valorOuTraco(moeda(totalPendente), falhou("Histórico financeiro")),
      descricao: `${pendentes.length} OS finalizadas pendentes`,
      cor: "roxo",
      icone: "◷",
    },
  ];

  return (
    <div className="dashboard-pagina">
      <header className="dashboard-introducao">
        <div>
          <span className="dashboard-sobretitulo">CENTRAL DE GESTÃO</span>
          <h2>Visão geral da oficina</h2>
          <p>
            Indicadores financeiros e operacionais para acompanhar seu negócio.
          </p>
        </div>
        <div className="dashboard-acoes-topo">
          <span className="dashboard-atualizacao">
            {atualizadoEm
              ? `Atualizado às ${atualizadoEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
              : "Aguardando dados"}
          </span>
          <button
            className="dashboard-atualizar"
            type="button"
            onClick={() => carregarDados(true)}
            disabled={carregando || atualizando}
          >
            <span aria-hidden="true">↻</span>{" "}
            {atualizando ? "Atualizando..." : "Atualizar dados"}
          </button>
        </div>
      </header>

      {falhas.length > 0 && (
        <div className="dashboard-aviso" role="alert">
          Não foi possível atualizar: {falhas.join(", ")}. Os dados dessas áreas
          estão indisponíveis.{" "}
          <button type="button" onClick={() => carregarDados(true)}>
            Tentar novamente
          </button>
        </div>
      )}

      <section
        className="dashboard-indicadores"
        aria-label="Indicadores financeiros"
      >
        {kpis.map((kpi) => (
          <article
            className={`dashboard-indicador dashboard-indicador-${kpi.cor}`}
            key={kpi.nome}
          >
            <div className="dashboard-indicador-topo">
              <span className={`dashboard-indicador-icone ${kpi.cor}`}>
                {kpi.icone}
              </span>
              <span className="dashboard-indicador-label">{kpi.nome}</span>
            </div>
            <strong className="dashboard-indicador-valor">{kpi.valor}</strong>
            <span className="dashboard-indicador-descricao">
              {kpi.descricao}
            </span>
          </article>
        ))}
      </section>

      <div className="dashboard-conteudo">
        <section className="dashboard-painel dashboard-painel-grafico">
          <div className="dashboard-painel-cabecalho">
            <div>
              <span className="dashboard-mini-titulo">DESEMPENHO</span>
              <h3>Evolução dos recebimentos</h3>
              <p>Valores por data de entrada das OS finalizadas</p>
            </div>
            <select
              aria-label="Período do gráfico"
              className="dashboard-seletor"
              value={periodo}
              onChange={(e) => setPeriodo(Number(e.target.value))}
            >
              <option value={3}>3 meses</option>
              <option value={6}>6 meses</option>
              <option value={12}>12 meses</option>
            </select>
          </div>
          {carregando ? (
            <div className="dashboard-sem-dados">Carregando gráfico...</div>
          ) : falhou("Histórico financeiro") ? (
            <div className="dashboard-sem-dados">Histórico indisponível.</div>
          ) : (
            <>
              <div className="dashboard-legenda">
                <span>
                  <i className="dashboard-legenda-pago" /> Pago
                </span>
                <span>
                  <i className="dashboard-legenda-pendente" /> Pendente
                </span>
              </div>
              <Grafico historico={historico} periodo={periodo} />
            </>
          )}
          <div className="dashboard-painel-rodape">
            <span>Não inclui valores estornados.</span>
            <Link to="/financeiro" className="dashboard-link">
              Ver painel financeiro →
            </Link>
          </div>
        </section>

        <section className="dashboard-painel">
          <div className="dashboard-painel-cabecalho">
            <div>
              <span className="dashboard-mini-titulo">OPERAÇÃO</span>
              <h3>Resumo da oficina</h3>
              <p>Informações disponíveis no sistema</p>
            </div>
          </div>
          <div className="dashboard-resumo-lista">
            <div>
              <span>OS finalizadas no histórico</span>
              <strong>
                {valorOuTraco(historico.length, falhou("Histórico financeiro"))}
              </strong>
            </div>
            <div>
              <span>OS finalizadas pagas</span>
              <strong>
                {valorOuTraco(pagos, falhou("Histórico financeiro"))}
              </strong>
            </div>
            <div>
              <span>OS finalizadas estornadas</span>
              <strong>
                {valorOuTraco(estornados, falhou("Histórico financeiro"))}
              </strong>
            </div>
            <div>
              <span>Peças cadastradas</span>
              <strong>
                {valorOuTraco(dados.pecas.length, falhou("Peças"))}
              </strong>
            </div>
            <div>
              <span>Peças com estoque baixo</span>
              <strong className={pecasBaixas ? "dashboard-alerta-numero" : ""}>
                {valorOuTraco(pecasBaixas, falhou("Peças"))}
              </strong>
            </div>
            <div>
              <span>Serviços cadastrados</span>
              <strong>
                {valorOuTraco(dados.servicos.length, falhou("Serviços"))}
              </strong>
            </div>
            <div>
              <span>Colaboradores</span>
              <strong>
                {valorOuTraco(
                  dados.funcionarios.length,
                  falhou("Colaboradores"),
                )}
              </strong>
            </div>
          </div>
        </section>
      </div>

      <div className="dashboard-conteudo dashboard-conteudo-secundario">
        <section className="dashboard-painel">
          <div className="dashboard-painel-cabecalho">
            <div>
              <span className="dashboard-mini-titulo">MOVIMENTAÇÃO</span>
              <h3>Últimas OS finalizadas</h3>
              <p>Histórico de faturamento da oficina</p>
            </div>
            <Link to="/financeiro" className="dashboard-link">
              Ver histórico →
            </Link>
          </div>
          {carregando ? (
            <div className="dashboard-sem-dados">Carregando ordens...</div>
          ) : falhou("Histórico financeiro") ? (
            <div className="dashboard-sem-dados">Histórico indisponível.</div>
          ) : historico.length === 0 ? (
            <div className="dashboard-sem-dados">
              Nenhuma OS finalizada encontrada.
            </div>
          ) : (
            <div className="dashboard-lista-ordens">
              {[...historico]
                .sort(
                  (a, b) =>
                    (b.dataEntrada || "").localeCompare(a.dataEntrada || "") ||
                    Number(b.id) - Number(a.id),
                )
                .slice(0, 5)
                .map((os) => (
                  <div className="dashboard-ordem" key={os.id}>
                    <div className="dashboard-ordem-identificacao">
                      <span className="dashboard-ordem-icone">▤</span>
                      <div>
                        <strong>Ordem de Serviço #{os.id}</strong>
                        <span>
                          {os.dataEntrada
                            ? os.dataEntrada.split("-").reverse().join("/")
                            : "Data não informada"}{" "}
                          · {moeda(os.valor)}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`dashboard-status dashboard-status-${(os.statusPagamento || "pendente").toLowerCase()}`}
                    >
                      {os.statusPagamento === "PAGO"
                        ? "Pago"
                        : os.statusPagamento === "ESTORNADO"
                          ? "Estornado"
                          : "Pendente"}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </section>
        <section className="dashboard-painel">
          <div className="dashboard-painel-cabecalho">
            <div>
              <span className="dashboard-mini-titulo">RECURSOS</span>
              <h3>Estoque e despesas</h3>
              <p>Panorama complementar</p>
            </div>
          </div>
          <div className="dashboard-destaque-secundario">
            <span>Valor estimado em estoque</span>
            <strong>
              {valorOuTraco(moeda(estoqueValor), falhou("Peças"))}
            </strong>
            <small>Preço de venda × quantidade disponível</small>
          </div>
          <div className="dashboard-resumo-lista">
            <div>
              <span>Despesas cadastradas</span>
              <strong>
                {valorOuTraco(dados.despesas.length, falhou("Despesas"))}
              </strong>
            </div>
            <div>
              <span>OS pendentes de pagamento</span>
              <strong>
                {valorOuTraco(pendentes.length, falhou("Histórico financeiro"))}
              </strong>
            </div>
          </div>
          <Link to="/pecas" className="dashboard-link dashboard-link-inferior">
            Consultar estoque →
          </Link>
        </section>
      </div>

      <section className="dashboard-atalhos-secao">
        <div className="dashboard-secao-titulo">
          <div>
            <span className="dashboard-mini-titulo">NAVEGAÇÃO</span>
            <h3>Acesso rápido</h3>
            <p>Gerencie as principais áreas da oficina</p>
          </div>
        </div>
        <div className="dashboard-atalhos">
          {clientesAdmin !== null && (
            <Link className="dashboard-atalho dashboard-atalho-clientes" to="/clientes-admin">
              <span className="dashboard-atalho-icone" aria-hidden="true">♙</span>
              <div>
                <strong>Gestão de clientes</strong>
                <span>Cadastros, contatos e veículos</span>
                <span className="dashboard-atalho-contagem">
                  {clientesAdmin} {clientesAdmin === 1 ? "cliente cadastrado" : "clientes cadastrados"}
                </span>
              </div>
              <span className="dashboard-atalho-seta" aria-hidden="true">→</span>
            </Link>
          )}
          {atalhos.map((a) => (
            <Link className="dashboard-atalho" to={a.caminho} key={a.caminho}>
              <span className="dashboard-atalho-icone">{a.icone}</span>
              <div>
                <strong>{a.titulo}</strong>
                <span>{a.descricao}</span>
              </div>
              <span className="dashboard-atalho-seta">→</span>
            </Link>
          ))}
        </div>
      </section>
      <p className="dashboard-nota">
        Indicadores financeiros acumulados. O lucro estimado não representa
        lucro líquido contábil nem fluxo de caixa efetivo.
      </p>
    </div>
  );
}
