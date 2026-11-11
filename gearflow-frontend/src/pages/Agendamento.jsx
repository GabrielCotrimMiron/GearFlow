import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import api from "../services/api";
import {
    gerarAutorizacaoBasica,
    obterCredenciais,
} from "../services/clienteAuth";
import "./Veiculos.css";

export default function AgendamentoCliente() {
    const navigate = useNavigate();

    const [veiculos, setVeiculos] = useState([]);
    const [horarios, setHorarios] = useState([]);

    const [carregandoVeiculos, setCarregandoVeiculos] = useState(true);
    const [buscandoHorarios, setBuscandoHorarios] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState(false);

    const [form, setForm] = useState({
        veiculoId: "",
        dataAgendamento: "",
        horario: "",
        motivo: "",
    });

    useEffect(() => {
        if (!obterCredenciais()) {
            navigate("/", { replace: true });
            return;
        }

        async function carregarVeiculos() {
            try {
                const response = await api.get("/veiculos/meus", {
                    headers: { Authorization: gerarAutorizacaoBasica() },
                });
                const frota = Array.isArray(response.data) ? response.data : [];
                setVeiculos(frota);

                if (frota.length === 1) {
                    setForm((prev) => ({ ...prev, veiculoId: frota[0].id }));
                }
            } catch (error) {
                console.error("Erro ao carregar veículos:", error);
                setErro("Não foi possível carregar seus veículos. Verifique sua conexão.");
            } finally {
                setCarregandoVeiculos(false);
            }
        }
        carregarVeiculos();
    }, [navigate]);

    useEffect(() => {
        if (!form.dataAgendamento) {
            setHorarios([]);
            return;
        }

        async function buscarHorarios() {
            setBuscandoHorarios(true);
            setForm((prev) => ({ ...prev, horario: "" }));

            try {
                const response = await api.get(
                    `/agendamentos/horarios-disponiveis?data=${form.dataAgendamento}`,
                    { headers: { Authorization: gerarAutorizacaoBasica() } }
                );
                setHorarios(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error("Erro ao buscar horários:", error);
                setHorarios([]);
            } finally {
                setBuscandoHorarios(false);
            }
        }

        buscarHorarios();
    }, [form.dataAgendamento]);

    async function handleAgendar(evento) {
        evento.preventDefault();
        setSalvando(true);
        setErro("");

        try {
            const payload = {
                veiculo: { id: Number(form.veiculoId) },
                dataAgendamento: form.dataAgendamento,
                horario: form.horario,
                motivo: form.motivo,
            };

            await api.post("/agendamentos/meus", payload, {
                headers: { Authorization: gerarAutorizacaoBasica() },
            });

            setSucesso(true);
        } catch (error) {
            console.error("Erro ao agendar:", error);
            setErro(
                error.response?.data?.message ||
                "Não foi possível concluir o agendamento. Verifique se o horário ainda está livre."
            );
            setSalvando(false);
        }
    }

    const hoje = new Date().toISOString().split("T")[0];

    if (sucesso) {
        return (
            <DashboardLayout
                titulo="Agendar Consulta"
                subtitulo="Marque um horário para o seu veículo na oficina."
                tipoUsuario="CLIENTE"
            >
                <div className="veiculos-pagina">
                    <div className="veiculos-vazio">
                        <span style={{ fontSize: "32px", color: "#278f8b", display: "block", marginBottom: "15px" }}>✓</span>
                        <strong style={{ fontSize: "18px", color: "#2a4454" }}>Agendamento solicitado com sucesso!</strong>
                        <p style={{ marginTop: "8px", marginBottom: "24px" }}>
                            Sua solicitação foi enviada para a oficina. Assim que aprovada, uma nova Ordem de Serviço será gerada.
                        </p>
                        <button
                            type="button"
                            className="veiculos-btn veiculos-btn-primario"
                            onClick={() => navigate("/cliente")}
                        >
                            Voltar ao Painel
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            titulo="Agendar Consulta"
            subtitulo="Marque um horário para o seu veículo na oficina."
            tipoUsuario="CLIENTE"
        >
            <div className="veiculos-pagina">
                <section className="veiculos-topo">
                    <div>
                        <span className="veiculos-eyebrow">NOVA SOLICITAÇÃO</span>
                        <h2>Agendar Serviço na Oficina</h2>
                        <p>
                            Escolha seu veículo, a data desejada e o melhor horário disponível para atendimento.
                        </p>
                    </div>
                </section>

                {erro && <div className="veiculos-alerta-erro">{erro}</div>}

                {carregandoVeiculos ? (
                    <div className="veiculos-vazio">Carregando formulário...</div>
                ) : veiculos.length === 0 ? (
                    <div className="veiculos-vazio">
                        <strong>Nenhum veículo cadastrado.</strong>
                        <p>Você precisa de um veículo cadastrado para solicitar um agendamento.</p>
                        <button
                            type="button"
                            className="veiculos-btn veiculos-btn-primario"
                            style={{ marginTop: "15px" }}
                            onClick={() => navigate("/cliente/veiculos")}
                        >
                            Ir para Meus Veículos
                        </button>
                    </div>
                ) : (
                    <form className="veiculos-form-card" onSubmit={handleAgendar}>
                        <h3>Detalhes do Agendamento</h3>

                        <div className="veiculos-form-grid" style={{ gridTemplateColumns: "1fr" }}>
                            <div className="veiculos-campo">
                                <label>Veículo *</label>
                                <select
                                    required
                                    value={form.veiculoId}
                                    onChange={(e) => setForm({ ...form, veiculoId: e.target.value })}
                                >
                                    <option value="" disabled>Selecione um veículo...</option>
                                    {veiculos.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.placa} — {v.marca} {v.modelo}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="veiculos-form-grid">
                            <div className="veiculos-campo">
                                <label>Data Desejada *</label>
                                <input
                                    type="date"
                                    required
                                    min={hoje}
                                    value={form.dataAgendamento}
                                    onChange={(e) => setForm({ ...form, dataAgendamento: e.target.value })}
                                />
                            </div>

                            <div className="veiculos-campo">
                                <label>Horário *</label>
                                <select
                                    required
                                    disabled={!form.dataAgendamento || buscandoHorarios}
                                    value={form.horario}
                                    onChange={(e) => setForm({ ...form, horario: e.target.value })}
                                    style={{ opacity: (!form.dataAgendamento || buscandoHorarios) ? 0.6 : 1 }}
                                >
                                    <option value="" disabled>
                                        {buscandoHorarios
                                            ? "Buscando horários..."
                                            : !form.dataAgendamento
                                                ? "Selecione a data primeiro"
                                                : horarios.length === 0
                                                    ? "Nenhum horário livre"
                                                    : "Escolha um horário..."}
                                    </option>
                                    {horarios.map((hora) => {
                                        const horaFormatada = hora.substring(0, 5);
                                        return (
                                            <option key={hora} value={horaFormatada}>
                                                {horaFormatada}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>

                        <div className="veiculos-form-grid" style={{ gridTemplateColumns: "1fr" }}>
                            <div className="veiculos-campo">
                                <label>Descrição do Problema ou Serviço Solicitado (Opcional)</label>
                                <textarea
                                    placeholder="Ex: Troca de óleo, revisão dos 50 mil km, barulho na suspensão..."
                                    rows={4}
                                    value={form.motivo}
                                    onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                                    style={{
                                        padding: "12px",
                                        border: "1px solid #dce5e8",
                                        borderRadius: "8px",
                                        fontSize: "13px",
                                        fontFamily: "inherit",
                                        resize: "vertical"
                                    }}
                                />
                            </div>
                        </div>

                        <div className="veiculos-form-rodape">
                            <button
                                type="button"
                                className="veiculos-btn veiculos-btn-secundario"
                                onClick={() => navigate("/cliente")}
                                disabled={salvando}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="veiculos-btn veiculos-btn-primario"
                                disabled={salvando || horarios.length === 0}
                            >
                                {salvando ? "Enviando..." : "Confirmar Agendamento"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </DashboardLayout>
    );
}