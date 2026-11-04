
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import api from "../services/api";
import {
  gerarAutorizacaoBasica,
  obterCredenciais,
} from "../services/clienteAuth";
import "./DashboardCliente.css";

function formatarMoeda(valor) {
  return Number(valor ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data) {
  if (!data) return "Não informada";
  const texto = String(data).split("T")[0];
  const partes = texto.split("-");
  return partes.length === 3
    ? `${partes[2]}/${partes[1]}/${partes[0]}`
    : texto;
}

function formatarStatus(status) {
  const nomes = {
    ABERTA: "Aberta",
    PENDENTE: "Pendente",
    AGUARDANDO: "Aguardando",
    EM_EXECUCAO: "Em execução",
    FINALIZADA: "Finalizada",
    CANCELADA: "Cancelada",
  };

  return nomes[status] ||
    String(status || "Não informado").replaceAll("_", " ");
}

function classeStatus(status) {
  if (status === "FINALIZADA") return "finalizada";
  if (status === "EM_EXECUCAO") return "execucao";
  if (status === "CANCELADA") return "cancelada";
  return "pendente";
}

function EtiquetaStatus({ status }) {
  return (
    <span className={`cliente-status ${classeStatus(status)}`}>
      <span className="cliente-status-ponto" />
      {formatarStatus(status)}
    </span>
  );
}

function ModalOrcamento({
  ordem,
  orcamento,
  carregando,
  erro,
  onClose,
}) {
  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function fecharComEscape(evento) {
      if (evento.key === "Escape") onClose();
    }

    document.addEventListener("keydown", fecharComEscape);

    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", fecharComEscape);
    };
  }, [onClose]);

  const itens = Array.isArray(orcamento?.itens)
    ? orcamento.itens
    : [];

  return createPortal(
    <div
      className="cliente-modal-overlay"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onClose();
      }}
    >
      <section
        className="cliente-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cliente-orcamento-titulo"
      >
        <header className="cliente-modal-header">
          <div>
            <span className="cliente-eyebrow">
              GEARFLOW / ÁREA DO CLIENTE
            </span>
            <h2 id="cliente-orcamento-titulo">
              Orçamento #{ordem.id}
            </h2>
            <p>Detalhamento da ordem de serviço</p>
          </div>

          <button
            type="button"
            className="cliente-modal-fechar"
            onClick={onClose}
            aria-label="Fechar orçamento"
          >
            ×
          </button>
        </header>

        <div className="cliente-modal-conteudo">
          <div className="cliente-modal-veiculo">
            <div className="cliente-modal-veiculo-info">
              <span className="cliente-modal-veiculo-icone">🚘</span>
              <div>
                <span className="cliente-campo-label">VEÍCULO</span>
                <strong>{ordem.veiculo || "Não informado"}</strong>
                <small>
                  Placa: {ordem.placa || "Não informada"}
                </small>
              </div>
            </div>

            <EtiquetaStatus
              status={orcamento?.status || ordem.status}
            />
          </div>

          {carregando && (
            <div className="cliente-modal-mensagem" role="status">
              <div className="cliente-spinner" />
              <strong>Carregando orçamento...</strong>
              <p>Consultando os detalhes do serviço.</p>
            </div>
          )}

          {erro && !carregando && (
            <div className="cliente-alerta-erro" role="alert">
              <strong>Não foi possível carregar o orçamento.</strong>
              <p>{erro}</p>
            </div>
          )}

          {orcamento && !carregando && (
            <>
              <section className="cliente-orcamento-secao">
                <div className="cliente-orcamento-secao-titulo">
                  <span className="cliente-secao-icone">✎</span>
                  <h3>Diagnóstico da oficina</h3>
                </div>

                <p className="cliente-diagnostico">
                  {orcamento.diagnostico ||
                    "Nenhum diagnóstico informado."}
                </p>
              </section>

              <section className="cliente-orcamento-secao">
                <div className="cliente-orcamento-secao-topo">
                  <div className="cliente-orcamento-secao-titulo">
                    <span className="cliente-secao-icone">▤</span>
                    <h3>Itens do orçamento</h3>
                  </div>
                  <span className="cliente-contador-itens">
                    {itens.length} {itens.length === 1 ? "item" : "itens"}
                  </span>
                </div>

                {itens.length === 0 ? (
                  <div className="cliente-itens-vazio">
                    Nenhuma peça ou serviço com valor registrado.
                  </div>
                ) : (
                  <div className="cliente-orcamento-itens">
                    {itens.map((item, index) => (
                      <div
                        className="cliente-orcamento-item"
                        key={item.id ?? index}
                      >
                        <div className="cliente-item-info">
                          <span className="cliente-item-tipo">
                            {item.tipo === "PECA"
                              ? "PEÇA"
                              : item.tipo === "SERVICO"
                                ? "SERVIÇO"
                                : item.tipo || "OUTRO"}
                          </span>
                          <strong>
                            {item.descricao || "Item sem descrição"}
                          </strong>
                          <small>
                            {item.quantidade ?? 0} ×{" "}
                            {formatarMoeda(item.valorUnitario)}
                          </small>
                        </div>
                        <strong className="cliente-item-preco">
                          {formatarMoeda(item.subtotal)}
                        </strong>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <div className="cliente-orcamento-total">
                <div>
                  <span>VALOR TOTAL DO ORÇAMENTO</span>
                  <small>Soma dos itens cadastrados</small>
                </div>
                <strong>
                  {formatarMoeda(orcamento.valorTotal)}
                </strong>
              </div>
            </>
          )}
        </div>

        <footer className="cliente-modal-footer">
          <span>
            OS #{ordem.id} · Entrada em{" "}
            {formatarData(ordem.dataEntrada)}
          </span>
          <button
            type="button"
            className="cliente-btn cliente-btn-secundario"
            onClick={onClose}
          >
            Fechar
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}

export default function DashboardCliente() {
  const navigate = useNavigate();

  const [ordens, setOrdens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState("TODAS");

  const [ordemSelecionada, setOrdemSelecionada] = useState(null);
  const [orcamento, setOrcamento] = useState(null);
  const [carregandoOrcamento, setCarregandoOrcamento] =
    useState(false);
  const [erroOrcamento, setErroOrcamento] = useState("");

  const requisicaoOrcamento = useRef(0);

  useEffect(() => {
    if (!obterCredenciais()) {
      navigate("/", { replace: true });
      return;
    }

    let ativo = true;

    async function buscarOrdens() {
      try {
        const response = await api.get(
          "/ordens-servico/minhas",
          {
            headers: {
              Authorization: gerarAutorizacaoBasica(),
            },
          },
        );

        if (ativo) {
          setOrdens(
            Array.isArray(response.data) ? response.data : [],
          );
        }
      } catch (error) {
        console.error("Erro ao carregar ordens:", error);
        if (ativo) {
          setErro(
            `Não foi possível carregar suas ordens (${
              error.response?.status || error.message
            }).`,
          );
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    buscarOrdens();

    return () => {
      ativo = false;
    };
  }, [navigate]);

  async function atualizarOrdens() {
    if (atualizando) return;

    setAtualizando(true);
    setErro("");

    try {
      const response = await api.get(
        "/ordens-servico/minhas",
        {
          headers: {
            Authorization: gerarAutorizacaoBasica(),
          },
        },
      );

      setOrdens(
        Array.isArray(response.data) ? response.data : [],
      );
    } catch (error) {
      console.error(error);
      setErro("Não foi possível atualizar suas ordens.");
    } finally {
      setAtualizando(false);
    }
  }

  const fecharOrcamento = useCallback(() => {
    requisicaoOrcamento.current += 1;
    setOrdemSelecionada(null);
    setOrcamento(null);
    setErroOrcamento("");
    setCarregandoOrcamento(false);
  }, []);

  async function visualizarOrcamento(ordem) {
    const identificador = ++requisicaoOrcamento.current;

    setOrdemSelecionada(ordem);
    setOrcamento(null);
    setErroOrcamento("");
    setCarregandoOrcamento(true);

    try {
      const response = await api.get(
        `/ordens-servico/${ordem.id}/orcamento`,
        {
          headers: {
            Authorization: gerarAutorizacaoBasica(),
          },
        },
      );

      if (identificador === requisicaoOrcamento.current) {
        setOrcamento(response.data);
      }
    } catch (error) {
      console.error("Erro ao carregar orçamento:", error);

      if (identificador === requisicaoOrcamento.current) {
        setErroOrcamento(
          `Erro ${error.response?.status || error.message}`,
        );
      }
    } finally {
      if (identificador === requisicaoOrcamento.current) {
        setCarregandoOrcamento(false);
      }
    }
  }

  const emAndamento = ordens.filter(
    (ordem) => ordem.status === "EM_EXECUCAO",
  ).length;

  const finalizadas = ordens.filter(
    (ordem) => ordem.status === "FINALIZADA",
  ).length;

  const ordensFiltradas = ordens.filter((ordem) => {
    if (filtro === "TODAS") return true;
    if (filtro === "ANDAMENTO") {
      return ordem.status !== "FINALIZADA" &&
        ordem.status !== "CANCELADA";
    }
    return ordem.status === filtro;
  });

  return (
    <DashboardLayout
      titulo="Minha Oficina"
      subtitulo="Acompanhe seus veículos e consulte seus orçamentos."
      tipoUsuario="CLIENTE"
    >
      <div className="cliente-pagina">
        <section className="cliente-boas-vindas">
          <div>
            <span className="cliente-eyebrow">
              ÁREA EXCLUSIVA DO CLIENTE
            </span>
            <h2>Seu veículo, sempre acompanhado.</h2>
            <p>
              Consulte suas ordens de serviço, acompanhe o andamento
              dos reparos e visualize seus orçamentos em um só lugar.
            </p>
          </div>
          <span className="cliente-boas-vindas-icone" aria-hidden="true">
            🚘
          </span>
        </section>

        <section className="cliente-indicadores">
          <div className="cliente-indicador">
            <span className="cliente-indicador-icone azul">▤</span>
            <div>
              <strong>{carregando ? "—" : ordens.length}</strong>
              <span>Total de ordens</span>
            </div>
          </div>

          <div className="cliente-indicador">
            <span className="cliente-indicador-icone verde">⚙</span>
            <div>
              <strong>{carregando ? "—" : emAndamento}</strong>
              <span>Em execução</span>
            </div>
          </div>

          <div className="cliente-indicador">
            <span className="cliente-indicador-icone amarelo">✓</span>
            <div>
              <strong>{carregando ? "—" : finalizadas}</strong>
              <span>Finalizadas</span>
            </div>
          </div>
        </section>

        <section className="cliente-ordens-secao">
          <div className="cliente-ordens-header">
            <div>
              <h3>Minhas ordens de serviço</h3>
              <p>
                Acompanhe as informações dos seus atendimentos.
              </p>
            </div>

            <button
              type="button"
              className="cliente-btn cliente-btn-secundario"
              onClick={atualizarOrdens}
              disabled={carregando || atualizando}
            >
              ↻ {atualizando ? "Atualizando..." : "Atualizar"}
            </button>
          </div>

          <div className="cliente-filtros">
            {[
              ["TODAS", "Todas"],
              ["ANDAMENTO", "Em aberto"],
              ["FINALIZADA", "Finalizadas"],
            ].map(([valor, rotulo]) => (
              <button
                key={valor}
                type="button"
                className={`cliente-filtro ${
                  filtro === valor ? "ativo" : ""
                }`}
                onClick={() => setFiltro(valor)}
              >
                {rotulo}
              </button>
            ))}
          </div>

          {erro && (
            <div className="cliente-alerta-erro" role="alert">
              {erro}
            </div>
          )}

          {carregando ? (
            <div className="cliente-estado-vazio">
              <div className="cliente-spinner" />
              <h3>Carregando suas ordens...</h3>
              <p>Estamos consultando seus atendimentos.</p>
            </div>
          ) : ordensFiltradas.length === 0 ? (
            <div className="cliente-estado-vazio">
              <span className="cliente-vazio-icone">▤</span>
              <h3>Nenhuma ordem encontrada</h3>
              <p>
                {filtro === "TODAS"
                  ? "Você ainda não possui ordens de serviço cadastradas."
                  : "Não há ordens correspondentes a este filtro."}
              </p>
            </div>
          ) : (
            <div className="cliente-ordens-grid">
              {ordensFiltradas.map((ordem) => (
                <article
                  className="cliente-ordem-card"
                  key={ordem.id}
                >
                  <div className="cliente-ordem-topo">
                    <span className="cliente-ordem-numero">
                      OS #{ordem.id}
                    </span>
                    <EtiquetaStatus status={ordem.status} />
                  </div>

                  <div className="cliente-ordem-veiculo">
                    <span className="cliente-veiculo-icone">🚘</span>
                    <div>
                      <strong>
                        {ordem.veiculo || "Veículo não informado"}
                      </strong>
                      <span>
                        Placa: {ordem.placa || "Não informada"}
                      </span>
                    </div>
                  </div>

                  <div className="cliente-ordem-data">
                    <span>Data de entrada</span>
                    <strong>
                      {formatarData(ordem.dataEntrada)}
                    </strong>
                  </div>

                  <button
                    type="button"
                    className="cliente-btn cliente-btn-primario"
                    onClick={() => visualizarOrcamento(ordem)}
                  >
                    <span aria-hidden="true">▤</span>
                    Visualizar orçamento
                    <span aria-hidden="true">→</span>
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {ordemSelecionada && (
        <ModalOrcamento
          ordem={ordemSelecionada}
          orcamento={orcamento}
          carregando={carregandoOrcamento}
          erro={erroOrcamento}
          onClose={fecharOrcamento}
        />
      )}
    </DashboardLayout>
  );
}
