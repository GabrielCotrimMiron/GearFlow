import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import api from "../services/api";
import "./Veiculos.css";

export default function GestaoAgendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [processandoId, setProcessandoId] = useState(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function carregarAgendamentos() {
    setCarregando(true);
    setErro("");
    setSucesso("");
    try {
      const response = await api.get("/agendamentos");
      setAgendamentos(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erro ao listar agendamentos:", error);
      setErro("Não foi possível carregar a lista de agendamentos.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregarAgendamentos();
  }, []);

  async function handleAprovar(id) {
    setProcessandoId(id);
    setErro("");
    setSucesso("");
    try {
      await api.put(`/agendamentos/${id}/aprovar`);
      setSucesso("Agendamento aprovado! Ordem de Serviço gerada com sucesso.");
      await carregarAgendamentos();
    } catch (error) {
      console.error("Erro ao aprovar:", error);
      setErro(
        error.response?.data?.message ||
          "Ocorreu um erro ao aprovar o agendamento e gerar a OS.",
      );
    } finally {
      setProcessandoId(null);
    }
  }

  async function handleCancelar(id) {
    if (
      !window.confirm(
        "Tem certeza que deseja cancelar esta solicitação de agendamento?",
      )
    ) {
      return;
    }

    setProcessandoId(id);
    setErro("");
    setSucesso("");
    try {
      await api.put(`/agendamentos/${id}/cancelar`);
      setSucesso("Agendamento cancelado.");
      await carregarAgendamentos();
    } catch (error) {
      console.error("Erro ao cancelar:", error);
      setErro("Não foi possível cancelar o agendamento.");
    } finally {
      setProcessandoId(null);
    }
  }

  function formatarDataBR(data) {
    if (!data) return "";
    const partes = data.split("-");
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  return (
    <DashboardLayout
      titulo="Gestão de Agendamentos"
      subtitulo="Acompanhe as solicitações, aprove horários e gere Ordens de Serviço automaticamente."
    >
      <div className="veiculos-pagina">
        <section className="veiculos-topo">
          <div>
            <span className="veiculos-eyebrow">RECEPÇÃO DA OFICINA</span>
            <h2>Agendamentos Solicitados</h2>
            <p>
              Avalie os pedidos dos clientes. Ao aprovar, o sistema criará a OS
              inicial vinculada ao veículo.
            </p>
          </div>

          <div className="veiculos-acoes-topo">
            <button
              type="button"
              className="veiculos-btn veiculos-btn-secundario"
              onClick={carregarAgendamentos}
              disabled={carregando}
            >
              ↻ Atualizar
            </button>
          </div>
        </section>

        {erro && <div className="veiculos-alerta-erro">{erro}</div>}
        {sucesso && <div className="veiculos-alerta-sucesso">{sucesso}</div>}

        {carregando ? (
          <div className="veiculos-vazio">Buscando agenda da oficina...</div>
        ) : agendamentos.length === 0 ? (
          <div className="veiculos-vazio">
            <strong>Nenhum agendamento encontrado.</strong>
          </div>
        ) : (
          <div className="veiculos-grid">
            {agendamentos.map((ag) => (
              <article className="veiculo-card" key={ag.id}>
                <div>
                  <div className="veiculo-card-topo">
                    <span className="veiculo-placa-badge">
                      {ag.dataAgendamento
                        ? formatarDataBR(ag.dataAgendamento)
                        : ""}
                    </span>
                    <span
                      className="veiculo-ano-badge"
                      style={{
                        fontSize: "13px",
                        fontWeight: "800",
                        background:
                          ag.status === "CANCELADO" ? "#f2d0d0" : "#e6f5f2",
                        color:
                          ag.status === "CANCELADO" ? "#a93232" : "#278f8b",
                      }}
                    >
                      {ag.horario ? ag.horario.substring(0, 5) : ""}
                    </span>
                  </div>

                  <div
                    className="veiculo-card-corpo"
                    style={{ marginTop: "12px" }}
                  >
                    <strong>
                      {ag.cliente?.nome || "Cliente não informado"}
                    </strong>
                    <div className="veiculo-detalhes-lista">
                      <span>
                        Veículo:{" "}
                        <strong>
                          {ag.veiculo?.marca} {ag.veiculo?.modelo} (
                          {ag.veiculo?.placa})
                        </strong>
                      </span>
                      <span>
                        Status:{" "}
                        <strong
                          style={{
                            color:
                              ag.status === "PENDENTE"
                                ? "#c27b2d"
                                : ag.status === "CANCELADO"
                                  ? "#a93232"
                                  : "#278f8b",
                          }}
                        >
                          {ag.status}
                        </strong>
                      </span>
                      {ag.motivo && (
                        <span
                          style={{
                            marginTop: "8px",
                            fontStyle: "italic",
                            borderTop: "1px solid #edf1f2",
                            paddingTop: "8px",
                          }}
                        >
                          "{ag.motivo}"
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {ag.status === "PENDENTE" ? (
                  <div
                    style={{ display: "flex", gap: "10px", marginTop: "16px" }}
                  >
                    <button
                      type="button"
                      className="veiculos-btn veiculos-btn-primario"
                      style={{ flex: 1 }}
                      onClick={() => handleAprovar(ag.id)}
                      disabled={processandoId === ag.id}
                    >
                      {processandoId === ag.id
                        ? "Gerando..."
                        : "✓ Aprovar e Gerar OS"}
                    </button>
                    <button
                      type="button"
                      className="veiculos-btn veiculos-btn-secundario"
                      style={{ color: "#a93232", borderColor: "#f2d0d0" }}
                      onClick={() => handleCancelar(ag.id)}
                      disabled={processandoId === ag.id}
                      title="Cancelar Agendamento"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "10px",
                      background: "#f8fcfb",
                      borderRadius: "8px",
                      border: "1px solid #e6edef",
                      fontSize: "12px",
                      color: "#718096",
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                  >
                    {ag.status === "CONFIRMADO"
                      ? `✅ OS #${ag.ordemServico?.id || "N/I"} Gerada com Sucesso`
                      : "🚫 Agendamento Cancelado"}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
