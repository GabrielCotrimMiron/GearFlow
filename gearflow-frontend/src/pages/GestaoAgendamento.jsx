import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import api from "../services/api";
import "./Veiculos.css"; // Reaproveita os estilos de cards e botões

export default function GestaoAgendamentos() {
    const [agendamentos, setAgendamentos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    async function carregarAgendamentos() {
        setCarregando(true);
        setErro("");
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
        carregarAgendamentos();
    }, []);

    function formatarDataBR(data) {
        if (!data) return "";
        const partes = data.split("-");
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    return (
        <DashboardLayout
            titulo="Gestão de Agendamentos"
            subtitulo="Acompanhe e gerencie as solicitações de consultas dos clientes."
        >
            <div className="veiculos-pagina">
                <section className="veiculos-topo">
                    <div>
                        <span className="veiculos-eyebrow">RECEPÇÃO DA OFICINA</span>
                        <h2>Agendamentos Solicitados</h2>
                        <p>
                            Visualize os pedidos de clientes. Em breve você poderá aprová-los e gerar a Ordem de Serviço.
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
                                        <span className="veiculo-placa-badge">{ag.dataAgendamento ? formatarDataBR(ag.dataAgendamento) : ""}</span>
                                        <span className="veiculo-ano-badge" style={{ fontSize: "13px", fontWeight: "800", background: "#e6f5f2", color: "#278f8b" }}>
                      {ag.horario ? ag.horario.substring(0,5) : ""}
                    </span>
                                    </div>

                                    <div className="veiculo-card-corpo" style={{ marginTop: "12px" }}>
                                        <strong>
                                            {ag.cliente?.nome || "Cliente não informado"}
                                        </strong>
                                        <div className="veiculo-detalhes-lista">
                      <span>
                        Veículo: <strong>{ag.veiculo?.marca} {ag.veiculo?.modelo} ({ag.veiculo?.placa})</strong>
                      </span>
                                            <span>Status: <strong style={{ color: ag.status === 'PENDENTE' ? '#c27b2d' : '#278f8b' }}>{ag.status}</strong></span>
                                            {ag.motivo && (
                                                <span style={{ marginTop: "8px", fontStyle: "italic", borderTop: "1px solid #edf1f2", paddingTop: "8px" }}>
                          "{ag.motivo}"
                        </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="veiculos-btn veiculos-btn-secundario"
                                    style={{ marginTop: "10px", opacity: 0.5, cursor: "not-allowed" }}
                                    disabled
                                >
                                    Em breve: Aprovar (RF19)
                                </button>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}