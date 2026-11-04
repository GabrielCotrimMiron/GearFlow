import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { gerarAutorizacaoBasica } from "../services/clienteAuth";
import "./Dashboard.css";

function extrairLista(dados) {
  if (Array.isArray(dados)) return dados;
  return Array.isArray(dados?.content) ? dados.content : [];
}

function formatarMoeda(valor) {
  return Number(valor ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarStatus(status) {
  const nomes = {
    EM_EXECUCAO: "Em execução",
    FINALIZADA: "Finalizada",
    ABERTA: "Aberta",
    PENDENTE: "Pendente",
    AGUARDANDO: "Aguardando",
  };

  return (
    nomes[status] ||
    String(status || "Não informado")
      .replaceAll("_", " ")
      .toLowerCase()
  );
}

function formatarPrioridade(prioridade) {
  const nomes = {
    URGENTE: "Urgente",
    ALTA: "Alta",
    NORMAL: "Normal",
  };

  return nomes[prioridade] || "Normal";
}

const PESO_PRIORIDADE = {
  URGENTE: 0,
  ALTA: 1,
  NORMAL: 2,
};

const ATALHOS = [
  {
    titulo: "Fila de prioridades",
    descricao: "Acompanhar ordens e urgências",
    caminho: "/fila-prioridade",
    icone: "↗",
  },
  {
    titulo: "Gestão de peças",
    descricao: "Consultar estoque e valores",
    caminho: "/pecas",
    icone: "▦",
  },
  {
    titulo: "Catálogo de serviços",
    descricao: "Gerenciar serviços da oficina",
    caminho: "/servicos",
    icone: "⚙",
  },
  {
    titulo: "Gestão de equipe",
    descricao: "Administrar colaboradores",
    caminho: "/equipe",
    icone: "♙",
  },
];

export default function Dashboard() {
  const [dados, setDados] = useState({
    ordens: [],
    pecas: [],
    servicos: [],
    funcionarios: [],
  });

  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erros, setErros] = useState([]);

  async function carregarDados(atualizacao = false) {
    if (atualizacao) {
      setAtualizando(true);
    } else {
      setCarregando(true);
    }

    const autorizacao = gerarAutorizacaoBasica();

    const requisicoes = [
      api.get("/ordens-servico/fila-prioridade", {
        headers: {
          Authorization: autorizacao,
        },
      }),
      api.get("/pecas"),
      api.get("/servicos"),
      api.get("/funcionarios"),
    ];

    try {
      const resultados = await Promise.allSettled(requisicoes);

      const nomes = ["ordens de serviço", "peças", "serviços", "funcionários"];

      const chaves = ["ordens", "pecas", "servicos", "funcionarios"];

      const novosErros = [];

      setDados((anteriores) => {
        const atualizados = { ...anteriores };

        resultados.forEach((resultado, indice) => {
          if (resultado.status === "fulfilled") {
            atualizados[chaves[indice]] = extrairLista(resultado.value.data);
          } else {
            console.error(
              `Erro ao carregar ${nomes[indice]}`,
              resultado.reason,
            );

            novosErros.push(nomes[indice]);
          }
        });

        return atualizados;
      });

      setErros(novosErros);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  useEffect(() => {
    let ativo = true;

    async function buscarDadosIniciais() {
      const autorizacao = gerarAutorizacaoBasica();

      const requisicoes = [
        api.get("/ordens-servico/fila-prioridade", {
          headers: {
            Authorization: autorizacao,
          },
        }),
        api.get("/pecas"),
        api.get("/servicos"),
        api.get("/funcionarios"),
      ];

      const resultados = await Promise.allSettled(requisicoes);

      if (!ativo) return;

      const nomes = ["ordens de serviço", "peças", "serviços", "funcionários"];

      const chaves = ["ordens", "pecas", "servicos", "funcionarios"];

      const novosDados = {
        ordens: [],
        pecas: [],
        servicos: [],
        funcionarios: [],
      };

      const novosErros = [];

      resultados.forEach((resultado, indice) => {
        if (resultado.status === "fulfilled") {
          novosDados[chaves[indice]] = extrairLista(resultado.value.data);
        } else {
          console.error(`Erro ao carregar ${nomes[indice]}`, resultado.reason);

          novosErros.push(nomes[indice]);
        }
      });

      setDados(novosDados);
      setErros(novosErros);
      setCarregando(false);
    }

    buscarDadosIniciais();

    return () => {
      ativo = false;
    };
  }, []);

  const { ordens, pecas, servicos, funcionarios } = dados;

  const ordensEmExecucao = ordens.filter(
    (ordem) => ordem.status === "EM_EXECUCAO",
  ).length;

  const ordensFinalizadas = ordens.filter(
    (ordem) => ordem.status === "FINALIZADA",
  ).length;

  const pecasEstoqueBaixo = pecas.filter(
    (peca) => peca.estoqueBaixo ?? Number(peca.qtdEstoque ?? 0) <= 5,
  ).length;

  const valorEstoque = pecas.reduce(
    (total, peca) =>
      total + Number(peca.valorUni ?? 0) * Number(peca.qtdEstoque ?? 0),
    0,
  );

  const ordensPrioritarias = [...ordens]
    .filter((ordem) => ordem.status !== "FINALIZADA")
    .sort((a, b) => {
      const pesoA = PESO_PRIORIDADE[a.prioridade] ?? 3;
      const pesoB = PESO_PRIORIDADE[b.prioridade] ?? 3;

      if (pesoA !== pesoB) return pesoA - pesoB;

      return Number(a.id ?? 0) - Number(b.id ?? 0);
    })
    .slice(0, 5);

  const indicadores = [
    {
      titulo: "Ordens de serviço",
      valor: ordens.length,
      descricao: "Total na fila consultada",
      icone: "▤",
      cor: "azul",
    },
    {
      titulo: "Em execução",
      valor: ordensEmExecucao,
      descricao: "Serviços em andamento",
      icone: "↗",
      cor: "verde",
    },
    {
      titulo: "Finalizadas",
      valor: ordensFinalizadas,
      descricao: "Ordens concluídas na fila",
      icone: "✓",
      cor: "verde",
    },
    {
      titulo: "Estoque baixo",
      valor: pecasEstoqueBaixo,
      descricao: "Peças que precisam de atenção",
      icone: "!",
      cor: "laranja",
    },
  ];

  return (
    <div className="dashboard-pagina">
      <div className="dashboard-introducao">
        <div>
          <span className="dashboard-sobretitulo">PAINEL DE CONTROLE</span>
          <h2>Visão geral da oficina</h2>
          <p>
            Acompanhe os principais indicadores e acesse rapidamente as áreas do
            GearFlow.
          </p>
        </div>

        <button
          type="button"
          className="dashboard-atualizar"
          onClick={() => carregarDados(true)}
          disabled={carregando || atualizando}
        >
          <span aria-hidden="true">↻</span>
          {atualizando ? "Atualizando..." : "Atualizar dados"}
        </button>
      </div>

      {erros.length > 0 && (
        <div className="dashboard-aviso" role="alert">
          Não foi possível consultar: {erros.join(", ")}. Os indicadores dessas
          áreas podem estar incompletos.
        </div>
      )}

      <section className="dashboard-indicadores">
        {indicadores.map((item) => (
          <div key={item.titulo} className="dashboard-indicador">
            <div className="dashboard-indicador-topo">
              <span className={`dashboard-indicador-icone ${item.cor}`}>
                {item.icone}
              </span>
              <span className="dashboard-indicador-label">{item.titulo}</span>
            </div>

            <strong className="dashboard-indicador-valor">
              {carregando ? "—" : item.valor}
            </strong>

            <span className="dashboard-indicador-descricao">
              {item.descricao}
            </span>
          </div>
        ))}
      </section>

      <div className="dashboard-conteudo">
        <section className="dashboard-painel dashboard-fila">
          <div className="dashboard-painel-cabecalho">
            <div>
              <h3>Fila de prioridades</h3>
              <p>Ordens de serviço que precisam de atenção</p>
            </div>

            <Link to="/fila-prioridade" className="dashboard-link">
              Ver todas →
            </Link>
          </div>

          {carregando ? (
            <div className="dashboard-sem-dados">Carregando ordens...</div>
          ) : ordensPrioritarias.length === 0 ? (
            <div className="dashboard-sem-dados">
              Nenhuma ordem pendente encontrada.
            </div>
          ) : (
            <div className="dashboard-lista-ordens">
              {ordensPrioritarias.map((ordem, index) => (
                <div key={ordem.id ?? index} className="dashboard-ordem">
                  <div className="dashboard-ordem-identificacao">
                    <span className="dashboard-ordem-icone">▤</span>
                    <div>
                      <strong>Ordem de Serviço #{ordem.id}</strong>
                      <span>{formatarStatus(ordem.status)}</span>
                    </div>
                  </div>

                  <span
                    className={`dashboard-prioridade ${
                      ordem.prioridade === "URGENTE"
                        ? "urgente"
                        : ordem.prioridade === "ALTA"
                          ? "alta"
                          : "normal"
                    }`}
                  >
                    {formatarPrioridade(ordem.prioridade)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-painel dashboard-resumo">
          <div className="dashboard-painel-cabecalho">
            <div>
              <h3>Resumo da operação</h3>
              <p>Informações gerais da oficina</p>
            </div>
          </div>

          <div className="dashboard-resumo-lista">
            <div>
              <span>Peças cadastradas</span>
              <strong>{carregando ? "—" : pecas.length}</strong>
            </div>
            <div>
              <span>Valor total em estoque</span>
              <strong>{carregando ? "—" : formatarMoeda(valorEstoque)}</strong>
            </div>
            <div>
              <span>Serviços cadastrados</span>
              <strong>{carregando ? "—" : servicos.length}</strong>
            </div>
            <div>
              <span>Colaboradores</span>
              <strong>{carregando ? "—" : funcionarios.length}</strong>
            </div>
          </div>
        </section>
      </div>

      <section className="dashboard-atalhos-secao">
        <div className="dashboard-secao-titulo">
          <h3>Acesso rápido</h3>
          <p>Navegue pelas principais funcionalidades</p>
        </div>

        <div className="dashboard-atalhos">
          {ATALHOS.map((atalho) => (
            <Link
              to={atalho.caminho}
              key={atalho.caminho}
              className="dashboard-atalho"
            >
              <span className="dashboard-atalho-icone">{atalho.icone}</span>

              <div>
                <strong>{atalho.titulo}</strong>
                <span>{atalho.descricao}</span>
              </div>

              <span className="dashboard-atalho-seta">→</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
