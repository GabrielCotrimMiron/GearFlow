import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import api from "../services/api";
import {
    gerarAutorizacaoBasica,
    obterCredenciais,
} from "../services/clienteAuth";
import "./Veiculos.css";

export default function MeusVeiculos() {
    const navigate = useNavigate();

    const [veiculos, setVeiculos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

    const [exibirForm, setExibirForm] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [novoVeiculo, setNovoVeiculo] = useState({
        placa: "",
        marca: "",
        modelo: "",
        ano: "",
        kmAtual: "",
        chassi: "",
    });

    const [veiculoHistorico, setVeiculoHistorico] = useState(null);
    const [historico, setHistorico] = useState([]);
    const [carregandoHistorico, setCarregandoHistorico] = useState(false);

    async function carregarMeusVeiculos() {
        setCarregando(true);
        setErro("");
        try {
            const response = await api.get("/veiculos/meus", {
                headers: { Authorization: gerarAutorizacaoBasica() },
            });
            setVeiculos(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Erro ao listar veículos do cliente:", error);
            setErro(
                error.response?.data?.message ||
                "Não foi possível carregar seus veículos."
            );
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        if (!obterCredenciais()) {
            navigate("/", { replace: true });
            return;
        }
        carregarMeusVeiculos();
    }, [navigate]);

    async function handleCadastrar(evento) {
        evento.preventDefault();
        setSalvando(true);
        setErro("");
        setSucesso("");

        try {
            const payload = {
                placa: novoVeiculo.placa,
                marca: novoVeiculo.marca,
                modelo: novoVeiculo.modelo,
                ano: novoVeiculo.ano ? Number(novoVeiculo.ano) : null,
                kmAtual: novoVeiculo.kmAtual ? Number(novoVeiculo.kmAtual) : 0,
                chassi: novoVeiculo.chassi || null,
            };

            await api.post("/veiculos/meus", payload, {
                headers: { Authorization: gerarAutorizacaoBasica() },
            });

            setSucesso("Veículo cadastrado e vinculado à sua conta com sucesso!");
            setNovoVeiculo({
                placa: "",
                marca: "",
                modelo: "",
                ano: "",
                kmAtual: "",
                chassi: "",
            });
            setExibirForm(false);
            await carregarMeusVeiculos();
        } catch (error) {
            console.error("Erro ao cadastrar veículo:", error);
            setErro(
                error.response?.data?.message ||
                "Não foi possível cadastrar o veículo. Verifique a placa informada."
            );
        } finally {
            setSalvando(false);
        }
    }

    async function abrirHistorico(veiculo) {
        setVeiculoHistorico(veiculo);
        setHistorico([]);
        setCarregandoHistorico(true);
        try {
            const response = await api.get(`/veiculos/${veiculo.id}/historico`, {
                headers: { Authorization: gerarAutorizacaoBasica() },
            });
            setHistorico(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Erro ao buscar histórico:", error);
        } finally {
            setCarregandoHistorico(false);
        }
    }

    return (
        <DashboardLayout
            titulo="Meus Veículos"
            subtitulo="Gerencie os veículos vinculados à sua conta para agendamentos e ordens de serviço."
            tipoUsuario="CLIENTE"
        >
            <div className="veiculos-pagina">
                <section className="veiculos-topo">
                    <div>
                        <span className="veiculos-eyebrow">FROTA DO CLIENTE</span>
                        <h2>Meus Veículos Cadastrados</h2>
                        <p>
                            Visualize seus carros ou adicione um novo veículo para realizar
                            agendamentos na oficina.
                        </p>
                    </div>

                    <div className="veiculos-acoes-topo">
                        <button
                            type="button"
                            className="veiculos-btn veiculos-btn-secundario"
                            onClick={carregarMeusVeiculos}
                            disabled={carregando}
                        >
                            ↻ Atualizar
                        </button>
                        <button
                            type="button"
                            className="veiculos-btn veiculos-btn-primario"
                            onClick={() => setExibirForm((ativo) => !ativo)}
                        >
                            {exibirForm ? "Cancelar" : "+ Cadastrar Veículo"}
                        </button>
                    </div>
                </section>

                {erro && <div className="veiculos-alerta-erro">{erro}</div>}
                {sucesso && <div className="veiculos-alerta-sucesso">{sucesso}</div>}

                {exibirForm && (
                    <div
                        className="veiculos-modal-overlay"
                        onMouseDown={(e) => {
                            if (e.target === e.currentTarget) setExibirForm(false);
                        }}
                    >
                        <div className="veiculos-modal-cadastro">
                            <header className="veiculos-modal-header">
                                <div>
                                    <span className="veiculos-eyebrow">ÁREA DO CLIENTE</span>
                                    <h3>Cadastrar Novo Veículo</h3>
                                </div>
                                <button
                                    type="button"
                                    className="veiculos-modal-fechar"
                                    onClick={() => setExibirForm(false)}
                                >
                                    ×
                                </button>
                            </header>

                            <form onSubmit={handleCadastrar}>
                                <div className="veiculos-form-grid">
                                    <div className="veiculos-campo">
                                        <label>Placa *</label>
                                        <input
                                            type="text"
                                            placeholder="ABC1D23"
                                            maxLength={8}
                                            required
                                            value={novoVeiculo.placa}
                                            onChange={(e) =>
                                                setNovoVeiculo({ ...novoVeiculo, placa: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div className="veiculos-campo">
                                        <label>Marca *</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Volkswagen"
                                            required
                                            value={novoVeiculo.marca}
                                            onChange={(e) =>
                                                setNovoVeiculo({ ...novoVeiculo, marca: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div className="veiculos-campo">
                                        <label>Modelo *</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Gol 1.6"
                                            required
                                            value={novoVeiculo.modelo}
                                            onChange={(e) =>
                                                setNovoVeiculo({ ...novoVeiculo, modelo: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div className="veiculos-campo">
                                        <label>Ano</label>
                                        <input
                                            type="number"
                                            placeholder="Ex: 2021"
                                            value={novoVeiculo.ano}
                                            onChange={(e) =>
                                                setNovoVeiculo({ ...novoVeiculo, ano: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div className="veiculos-campo">
                                        <label>Quilometragem Atual</label>
                                        <input
                                            type="number"
                                            placeholder="Ex: 45000"
                                            value={novoVeiculo.kmAtual}
                                            onChange={(e) =>
                                                setNovoVeiculo({ ...novoVeiculo, kmAtual: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div className="veiculos-campo">
                                        <label>Chassi (Opcional)</label>
                                        <input
                                            type="text"
                                            placeholder="9BW..."
                                            value={novoVeiculo.chassi}
                                            onChange={(e) =>
                                                setNovoVeiculo({ ...novoVeiculo, chassi: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="veiculos-form-rodape">
                                    <button
                                        type="button"
                                        className="veiculos-btn veiculos-btn-secundario"
                                        onClick={() => setExibirForm(false)}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="veiculos-btn veiculos-btn-primario"
                                        disabled={salvando}
                                    >
                                        {salvando ? "Salvando..." : "Salvar Veículo"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {carregando ? (
                    <div className="veiculos-vazio">Carregando seus veículos...</div>
                ) : veiculos.length === 0 ? (
                    <div className="veiculos-vazio">
                        <strong>Nenhum veículo vinculado à sua conta.</strong>
                        <p>
                            Clique em "+ Cadastrar Veículo" acima para registrar seu carro.
                        </p>
                    </div>
                ) : (
                    <div className="veiculos-grid">
                        {veiculos.map((v) => (
                            <article className="veiculo-card" key={v.id}>
                                <div>
                                    <div className="veiculo-card-topo">
                                        <span className="veiculo-placa-badge">{v.placa}</span>
                                        <span className="veiculo-ano-badge">
                      Ano {v.ano || "N/I"}
                    </span>
                                    </div>

                                    <div className="veiculo-card-corpo">
                                        <strong>
                                            {v.marca || "Marca"} {v.modelo || "Modelo"}
                                        </strong>
                                        <div className="veiculo-detalhes-lista">
                      <span>
                        KM Atual:{" "}
                          {Number(v.kmAtual ?? 0).toLocaleString("pt-BR")} km
                      </span>
                                            {v.chassi && <span>Chassi: {v.chassi}</span>}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="veiculos-btn veiculos-btn-secundario"
                                    onClick={() => abrirHistorico(v)}
                                >
                                    ▤ Ver Histórico de Manutenções
                                </button>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            {veiculoHistorico && (
                <div
                    className="veiculos-modal-overlay"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) setVeiculoHistorico(null);
                    }}
                >
                    <div className="veiculos-modal">
                        <div className="veiculos-modal-header">
                            <div>
                                <span className="veiculos-eyebrow">PRONTUÁRIO DO VEÍCULO</span>
                                <h3>
                                    {veiculoHistorico.marca} {veiculoHistorico.modelo} (
                                    {veiculoHistorico.placa})
                                </h3>
                            </div>
                            <button
                                type="button"
                                className="veiculos-btn veiculos-btn-secundario"
                                onClick={() => setVeiculoHistorico(null)}
                            >
                                ✕
                            </button>
                        </div>

                        {carregandoHistorico ? (
                            <p>Carregando histórico...</p>
                        ) : historico.length === 0 ? (
                            <p>Nenhuma manutenção registrada para este veículo.</p>
                        ) : (
                            historico.map((item, idx) => (
                                <div className="veiculos-historico-item" key={idx}>
                                    <strong>
                                        OS #{item.ordemServicoId || item.id} — Status:{" "}
                                        {item.status || "Concluída"}
                                    </strong>
                                    <span>
                    Diagnóstico:{" "}
                                        {item.diagnostico || item.obsDiag || "Não informado"}
                  </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}