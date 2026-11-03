
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import api from "../services/api";

import {
  gerarAutorizacaoBasica,
  obterCredenciais,
} from "../services/clienteAuth";

const cores = {
  primaria: "#FFC400",
  primariaEscura: "#E5B000",
  azul: "#29465B",
  texto: "#243746",
  secundario: "#64748B",
  borda: "#E2E8F0",
  fundo: "#F8FAFC",
  branco: "#FFFFFF",
};

function formatarMoeda(valor) {
  return Number(valor ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data) {
  if (!data) return "Não informada";

  const dataTexto = String(data).split("T")[0];
  const partes = dataTexto.split("-");

  if (partes.length !== 3) return dataTexto;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarStatus(status) {
  return status?.replaceAll("_", " ") ?? "Não informado";
}

function obterEstiloStatus(status) {
  switch (status) {
    case "FINALIZADA":
      return {
        backgroundColor: "#DCFCE7",
        color: "#166534",
      };

    case "EM_EXECUCAO":
      return {
        backgroundColor: "#DBEAFE",
        color: "#1D4ED8",
      };

    case "CANCELADA":
      return {
        backgroundColor: "#FEE2E2",
        color: "#B91C1C",
      };

    default:
      return {
        backgroundColor: "#FEF3C7",
        color: "#92400E",
      };
  }
}

function EtiquetaStatus({ status }) {
  return (
    <span
      style={{
        ...obterEstiloStatus(status),
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 12px",
        borderRadius: "999px",
        fontSize: "0.78rem",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
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

    const fecharComEscape = (evento) => {
      if (evento.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", fecharComEscape);

    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener(
        "keydown",
        fecharComEscape
      );
    };
  }, [onClose]);

  const itens = Array.isArray(orcamento?.itens)
    ? orcamento.itens
    : [];

  return createPortal(
    <div
      className="gf-orcamento-overlay"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="gf-orcamento-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gf-orcamento-titulo"
        tabIndex={-1}
      >
        <div className="gf-orcamento-header">
          <div>
            <div className="gf-orcamento-eyebrow">
              GEARFLOW / ÁREA DO CLIENTE
            </div>

            <h2
              id="gf-orcamento-titulo"
              className="gf-orcamento-titulo"
            >
              Orçamento #{ordem.id}
            </h2>

            <p className="gf-orcamento-subtitulo">
              Detalhamento da ordem de serviço
            </p>
          </div>

          <button
            type="button"
            className="gf-orcamento-fechar"
            onClick={onClose}
            aria-label="Fechar orçamento"
            title="Fechar orçamento"
          >
            ×
          </button>
        </div>

        <div className="gf-orcamento-conteudo">
          <div className="gf-orcamento-veiculo">
            <div>
              <span className="gf-orcamento-label">
                VEÍCULO
              </span>

              <strong className="gf-orcamento-veiculo-nome">
                {ordem.veiculo || "Não informado"}
              </strong>

              <span className="gf-orcamento-placa">
                Placa: {ordem.placa || "Não informada"}
              </span>
            </div>

            <div className="gf-orcamento-status">
              <span className="gf-orcamento-label">
                STATUS
              </span>

              <EtiquetaStatus
                status={orcamento?.status || ordem.status}
              />
            </div>
          </div>

          {carregando && (
            <div
              className="gf-orcamento-mensagem"
              role="status"
            >
              <div className="gf-orcamento-spinner" />
              <strong>Carregando orçamento...</strong>
              <span>
                Estamos consultando os detalhes do serviço.
              </span>
            </div>
          )}

          {erro && !carregando && (
            <div
              className="gf-orcamento-erro"
              role="alert"
            >
              <strong>Não foi possível carregar o orçamento.</strong>
              <p>{erro}</p>
            </div>
          )}

          {orcamento && !carregando && (
            <>
              <section className="gf-orcamento-secao">
                <span className="gf-orcamento-label">
                  DIAGNÓSTICO DA OFICINA
                </span>

                <p className="gf-orcamento-diagnostico">
                  {orcamento.diagnostico ||
                    "Nenhum diagnóstico informado."}
                </p>
              </section>

              <section className="gf-orcamento-secao">
                <div className="gf-orcamento-secao-header">
                  <h3>Itens do orçamento</h3>

                  <span className="gf-orcamento-contagem">
                    {itens.length}{" "}
                    {itens.length === 1 ? "item" : "itens"}
                  </span>
                </div>

                {itens.length === 0 ? (
                  <div className="gf-orcamento-vazio">
                    <span className="gf-orcamento-vazio-icone">
                      📋
                    </span>

                    <strong>
                      Nenhum item cadastrado
                    </strong>

                    <p>
                      Esta ordem de serviço ainda não possui
                      peças ou serviços com valores registrados.
                    </p>
                  </div>
                ) : (
                  <div className="gf-orcamento-itens">
                    {itens.map((item, index) => (
                      <div
                        key={item.id ?? index}
                        className="gf-orcamento-item"
                      >
                        <div className="gf-orcamento-item-info">
                          <span className="gf-orcamento-item-tipo">
                            {item.tipo === "PECA"
                              ? "PEÇA"
                              : item.tipo === "SERVICO"
                                ? "SERVIÇO"
                                : item.tipo || "OUTRO"}
                          </span>

                          <strong>
                            {item.descricao ||
                              "Item sem descrição"}
                          </strong>

                          <span className="gf-orcamento-item-detalhe">
                            {item.quantidade ?? 0} ×{" "}
                            {formatarMoeda(item.valorUnitario)}
                          </span>
                        </div>

                        <div className="gf-orcamento-item-preco">
                          {formatarMoeda(item.subtotal)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <div className="gf-orcamento-total">
                <div>
                  <span>VALOR TOTAL</span>
                  <small>
                    Soma dos itens cadastrados
                  </small>
                </div>

                <strong>
                  {formatarMoeda(orcamento.valorTotal)}
                </strong>
              </div>
            </>
          )}
        </div>

        <div className="gf-orcamento-footer">
          <span>
            OS #{ordem.id} · Entrada em{" "}
            {formatarData(ordem.dataEntrada)}
          </span>

          <button
            type="button"
            className="gf-orcamento-btn-fechar"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function DashboardCliente() {
  const navigate = useNavigate();

  const [ordens, setOrdens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [ordemSelecionada, setOrdemSelecionada] =
    useState(null);

  const [orcamento, setOrcamento] = useState(null);

  const [carregandoOrcamento, setCarregandoOrcamento] =
    useState(false);

  const [erroOrcamento, setErroOrcamento] = useState("");

  useEffect(() => {
    if (!obterCredenciais()) {
      navigate("/", { replace: true });
      return;
    }

    let ativo = true;

    async function carregarOrdens() {
      try {
        const response = await api.get(
          "/ordens-servico/minhas",
          {
            headers: {
              Authorization: gerarAutorizacaoBasica(),
            },
          }
        );

        if (ativo) {
          setOrdens(
            Array.isArray(response.data) ? response.data : []
          );
        }
      } catch (error) {
        console.error("Erro ao carregar ordens:", error);

        if (ativo) {
          setErro(
            `Erro ao carregar ordens: ${
              error.response?.status || error.message
            }`
          );
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarOrdens();

    return () => {
      ativo = false;
    };
  }, [navigate]);

  const fecharOrcamento = () => {
    setOrdemSelecionada(null);
    setOrcamento(null);
    setErroOrcamento("");
    setCarregandoOrcamento(false);
  };

  const visualizarOrcamento = async (ordem) => {
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
        }
      );

      setOrcamento(response.data);
    } catch (error) {
      console.error(
        "Erro ao carregar orçamento:",
        error
      );

      setErroOrcamento(
        `Erro ${error.response?.status || error.message}`
      );
    } finally {
      setCarregandoOrcamento(false);
    }
  };

  return (
    <DashboardLayout
      titulo="Bem-vindo ao GearFlow!"
      subtitulo="Acompanhe seus veículos e consulte seus orçamentos."
      tipoUsuario="CLIENTE"
    >
      <style>
        {`
          .gf-cliente-container {
            width: 100%;
            box-sizing: border-box;
          }

          .gf-cliente-cabecalho {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            margin-bottom: 22px;
          }

          .gf-cliente-cabecalho h3 {
            margin: 0;
            font-size: 1.25rem;
            color: ${cores.texto};
          }

          .gf-cliente-contador {
            background: #F1F5F9;
            color: ${cores.secundario};
            padding: 7px 12px;
            border-radius: 999px;
            font-size: 0.8rem;
            font-weight: 700;
          }

          .gf-cliente-lista {
            display: grid;
            grid-template-columns:
              repeat(auto-fit, minmax(min(100%, 360px), 1fr));
            gap: 16px;
          }

          .gf-cliente-card {
            display: flex;
            flex-direction: column;
            gap: 16px;
            background: ${cores.branco};
            border: 1px solid ${cores.borda};
            border-radius: 14px;
            padding: 20px;
            box-shadow: 0 3px 12px rgba(15, 23, 42, 0.035);
            transition: border-color 0.2s, box-shadow 0.2s;
          }

          .gf-cliente-card:hover {
            border-color: #CBD5E1;
            box-shadow: 0 6px 20px rgba(15, 23, 42, 0.07);
          }

          .gf-cliente-card-topo {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }

          .gf-cliente-card-id {
            font-size: 1.1rem;
            font-weight: 800;
            color: ${cores.azul};
          }

          .gf-cliente-card-veiculo {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }

          .gf-cliente-card-veiculo strong {
            color: ${cores.texto};
            font-size: 1rem;
          }

          .gf-cliente-card-veiculo span {
            color: ${cores.secundario};
            font-size: 0.85rem;
          }

          .gf-cliente-card-data {
            color: ${cores.secundario};
            font-size: 0.85rem;
            padding-top: 12px;
            border-top: 1px solid ${cores.borda};
          }

          .gf-cliente-btn-orcamento {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            width: 100%;
            padding: 12px 16px;
            border: none;
            border-radius: 9px;
            background: ${cores.primaria};
            color: #172B3A;
            font-weight: 800;
            font-size: 0.9rem;
            cursor: pointer;
            transition: background 0.2s, transform 0.2s;
          }

          .gf-cliente-btn-orcamento:hover {
            background: ${cores.primariaEscura};
            transform: translateY(-1px);
          }

          .gf-cliente-btn-orcamento:focus-visible,
          .gf-orcamento-fechar:focus-visible,
          .gf-orcamento-btn-fechar:focus-visible {
            outline: 3px solid #2563EB;
            outline-offset: 3px;
          }

          .gf-cliente-erro {
            padding: 16px;
            border-radius: 10px;
            background: #FEF2F2;
            color: #B91C1C;
            margin-bottom: 16px;
          }

          .gf-cliente-vazio {
            padding: 40px 20px;
            text-align: center;
            color: ${cores.secundario};
          }

          .gf-orcamento-overlay {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            box-sizing: border-box;
            background: rgba(15, 23, 42, 0.65);
            backdrop-filter: blur(4px);
          }

          .gf-orcamento-modal {
            display: flex;
            flex-direction: column;
            width: 100%;
            max-width: 700px;
            max-height: min(90vh, 850px);
            overflow: hidden;
            background: ${cores.branco};
            border-radius: 18px;
            box-shadow: 0 24px 70px rgba(0, 0, 0, 0.25);
            color: ${cores.texto};
          }

          .gf-orcamento-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
            padding: 26px 28px 22px;
            border-bottom: 1px solid ${cores.borda};
          }

          .gf-orcamento-eyebrow {
            font-size: 0.68rem;
            font-weight: 800;
            letter-spacing: 1.2px;
            color: ${cores.secundario};
            margin-bottom: 10px;
          }

          .gf-orcamento-titulo {
            font-size: 1.65rem;
            font-weight: 800;
            margin: 0;
            color: ${cores.azul};
          }

          .gf-orcamento-subtitulo {
            font-size: 0.88rem;
            color: ${cores.secundario};
            margin: 6px 0 0;
          }

          .gf-orcamento-fechar {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 38px;
            height: 38px;
            flex-shrink: 0;
            border: none;
            border-radius: 9px;
            background: #F1F5F9;
            color: ${cores.texto};
            font-size: 1.6rem;
            cursor: pointer;
          }

          .gf-orcamento-fechar:hover {
            background: #E2E8F0;
          }

          .gf-orcamento-conteudo {
            overflow-y: auto;
            padding: 24px 28px;
          }

          .gf-orcamento-veiculo {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 20px;
            padding: 20px;
            background: ${cores.fundo};
            border: 1px solid ${cores.borda};
            border-radius: 12px;
            margin-bottom: 24px;
          }

          .gf-orcamento-label {
            display: block;
            font-size: 0.68rem;
            font-weight: 800;
            letter-spacing: 0.8px;
            color: ${cores.secundario};
            margin-bottom: 8px;
          }

          .gf-orcamento-veiculo-nome {
            display: block;
            font-size: 1.05rem;
            color: ${cores.texto};
          }

          .gf-orcamento-placa {
            display: block;
            font-size: 0.85rem;
            color: ${cores.secundario};
            margin-top: 6px;
          }

          .gf-orcamento-status {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }

          .gf-orcamento-secao {
            margin-bottom: 26px;
          }

          .gf-orcamento-diagnostico {
            margin: 0;
            font-size: 0.93rem;
            line-height: 1.7;
            color: ${cores.texto};
          }

          .gf-orcamento-secao-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            margin-bottom: 14px;
          }

          .gf-orcamento-secao-header h3 {
            font-size: 1rem;
            margin: 0;
            color: ${cores.azul};
          }

          .gf-orcamento-contagem {
            color: ${cores.secundario};
            font-size: 0.8rem;
          }

          .gf-orcamento-itens {
            border: 1px solid ${cores.borda};
            border-radius: 12px;
            overflow: hidden;
          }

          .gf-orcamento-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            padding: 16px;
          }

          .gf-orcamento-item + .gf-orcamento-item {
            border-top: 1px solid ${cores.borda};
          }

          .gf-orcamento-item-info {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
            min-width: 0;
          }

          .gf-orcamento-item-info strong {
            font-size: 0.9rem;
            color: ${cores.texto};
            overflow-wrap: anywhere;
          }

          .gf-orcamento-item-tipo {
            background: #F1F5F9;
            color: ${cores.secundario};
            font-size: 0.65rem;
            font-weight: 800;
            letter-spacing: 0.5px;
            padding: 4px 8px;
            border-radius: 5px;
          }

          .gf-orcamento-item-detalhe {
            color: ${cores.secundario};
            font-size: 0.8rem;
          }

          .gf-orcamento-item-preco {
            font-size: 0.95rem;
            font-weight: 800;
            color: ${cores.azul};
            white-space: nowrap;
          }

          .gf-orcamento-total {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 20px;
            border-radius: 12px;
            background: #FFF9E5;
            border: 1px solid #FDE68A;
          }

          .gf-orcamento-total div {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }

          .gf-orcamento-total span {
            color: #7C5B00;
            font-size: 0.75rem;
            font-weight: 800;
            letter-spacing: 0.6px;
          }

          .gf-orcamento-total small {
            color: #947321;
            font-size: 0.75rem;
          }

          .gf-orcamento-total strong {
            font-size: 1.55rem;
            font-weight: 900;
            color: ${cores.azul};
            white-space: nowrap;
          }

          .gf-orcamento-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 16px 28px;
            border-top: 1px solid ${cores.borda};
          }

          .gf-orcamento-footer span {
            font-size: 0.8rem;
            color: ${cores.secundario};
          }

          .gf-orcamento-btn-fechar {
            background: ${cores.azul};
            color: white;
            padding: 11px 22px;
            border: none;
            border-radius: 8px;
            font-weight: 700;
            cursor: pointer;
          }

          .gf-orcamento-btn-fechar:hover {
            background: #1B3447;
          }

          .gf-orcamento-mensagem {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 50px 20px;
            text-align: center;
            color: ${cores.secundario};
          }

          .gf-orcamento-mensagem strong {
            color: ${cores.texto};
          }

          .gf-orcamento-spinner {
            width: 28px;
            height: 28px;
            border: 3px solid #E2E8F0;
            border-top-color: ${cores.primaria};
            border-radius: 50%;
            animation: gf-girar 0.8s linear infinite;
          }

          @keyframes gf-girar {
            to {
              transform: rotate(360deg);
            }
          }

          .gf-orcamento-erro {
            padding: 18px;
            border-radius: 10px;
            background: #FEF2F2;
            color: #B91C1C;
          }

          .gf-orcamento-erro p {
            margin: 8px 0 0;
          }

          .gf-orcamento-vazio {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            text-align: center;
            padding: 30px 20px;
            background: ${cores.fundo};
            border: 1px dashed ${cores.borda};
            border-radius: 12px;
          }

          .gf-orcamento-vazio-icone {
            font-size: 1.8rem;
          }

          .gf-orcamento-vazio p {
            max-width: 350px;
            margin: 0;
            color: ${cores.secundario};
            font-size: 0.85rem;
            line-height: 1.6;
          }

          @media (max-width: 600px) {
            .gf-orcamento-overlay {
              padding: 10px;
            }

            .gf-orcamento-modal {
              max-height: 95vh;
              border-radius: 14px;
            }

            .gf-orcamento-header,
            .gf-orcamento-conteudo {
              padding: 18px;
            }

            .gf-orcamento-titulo {
              font-size: 1.3rem;
            }

            .gf-orcamento-footer {
              padding: 14px 18px;
            }

            .gf-orcamento-footer span {
              display: none;
            }

            .gf-orcamento-btn-fechar {
              width: 100%;
            }

            .gf-orcamento-total {
              align-items: flex-start;
              flex-direction: column;
            }

            .gf-orcamento-total strong {
              font-size: 1.4rem;
            }

            .gf-cliente-card {
              padding: 16px;
            }
          }
        `}
      </style>

      <div className="gf-cliente-container">
        <div className="gf-cliente-cabecalho">
          <h3>Minhas Ordens de Serviço</h3>

          {!carregando && (
            <span className="gf-cliente-contador">
              {ordens.length}{" "}
              {ordens.length === 1 ? "ordem" : "ordens"}
            </span>
          )}
        </div>

        {erro && (
          <div className="gf-cliente-erro" role="alert">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="gf-cliente-vazio">
            Carregando suas ordens de serviço...
          </div>
        ) : ordens.length === 0 && !erro ? (
          <div className="gf-cliente-vazio">
            Nenhuma ordem de serviço encontrada.
          </div>
        ) : (
          <div className="gf-cliente-lista">
            {ordens.map((ordem) => (
              <div
                key={ordem.id}
                className="gf-cliente-card"
              >
                <div className="gf-cliente-card-topo">
                  <span className="gf-cliente-card-id">
                    OS #{ordem.id}
                  </span>

                  <EtiquetaStatus status={ordem.status} />
                </div>

                <div className="gf-cliente-card-veiculo">
                  <strong>
                    🚗 {ordem.veiculo || "Veículo não informado"}
                  </strong>

                  <span>
                    Placa: {ordem.placa || "Não informada"}
                  </span>
                </div>

                <div className="gf-cliente-card-data">
                  📅 Entrada:{" "}
                  {formatarData(ordem.dataEntrada)}
                </div>

                <button
                  type="button"
                  className="gf-cliente-btn-orcamento"
                  onClick={() => visualizarOrcamento(ordem)}
                >
                  <span aria-hidden="true">👁</span>
                  Visualizar Orçamento
                </button>
              </div>
            ))}
          </div>
        )}
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
