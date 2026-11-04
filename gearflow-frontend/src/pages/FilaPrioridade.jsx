
import { useEffect, useState } from "react";
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

  useEffect(() => {
    let ativo = true;

    async function carregarFila() {
      try {
        const resposta = await api.get("/ordens-servico/fila-prioridade", {
          headers: {
            Authorization: gerarAutorizacaoBasica(),
          },
        });

        if (ativo) {
          setOrdens(resposta.data);
          setFalhaCarregamento(false);
        }
      } catch (error) {
        if (ativo) {
          setFalhaCarregamento(true);

          setErro(
            error.response?.status === 401
              ? "Sua sessão expirou. Faça login novamente."
              : error.response?.status === 403
                ? "Você não tem permissão para acessar a fila."
                : "Não foi possível carregar as ordens de serviço.",
          );
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarFila();

    return () => {
      ativo = false;
    };
  }, []);

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

        {!falhaCarregamento && (
          <span className="fila-situacao">
            <span className="fila-situacao-ponto" />
            Fila atualizada
          </span>
        )}
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
    </div>
  );
}
