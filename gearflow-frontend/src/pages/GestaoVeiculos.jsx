import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import api from "../services/api";
import "./Veiculos.css";

export default function GestaoVeiculos() {
  const [veiculos, setVeiculos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
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
    nomeProprietario: "",
    emailCliente: "",
    clienteId: "",
  });

  const [veiculoHistorico, setVeiculoHistorico] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);

  async function carregarTodosVeiculos() {
    setCarregando(true);
    setErro("");
    try {
      const response = await api.get("/veiculos");
      setVeiculos(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erro ao listar veículos da oficina:", error);
      setErro(
        error.response?.data?.message ||
          "Não foi possível carregar a frota de veículos.",
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregarTodosVeiculos();
  }, []);

  async function handleCadastrar(evento) {
    evento.preventDefault();
    setSalvando(true);
    setErro("");
    setSucesso("");

    try {
      const clienteObj = {};
      if (novoVeiculo.emailCliente.trim()) {
        clienteObj.email = novoVeiculo.emailCliente.trim();
      }
      if (novoVeiculo.clienteId) {
        clienteObj.id = Number(novoVeiculo.clienteId);
      }

      const temCliente = clienteObj.email || clienteObj.id;
      const nome = novoVeiculo.nomeProprietario.trim();

      if (!temCliente && !nome) {
        setErro("Informe o e-mail/ID do cliente ou o nome do proprietário.");
        setSalvando(false);
        return;
      }

      const payload = {
        placa: novoVeiculo.placa,
        marca: novoVeiculo.marca,
        modelo: novoVeiculo.modelo,
        ano: novoVeiculo.ano ? Number(novoVeiculo.ano) : null,
        kmAtual: novoVeiculo.kmAtual ? Number(novoVeiculo.kmAtual) : 0,
        chassi: novoVeiculo.chassi || null,
      };
      if (temCliente) payload.cliente = clienteObj;
      if (nome) payload.nomeProprietario = nome;

      await api.post("/veiculos", payload);

      setSucesso(
        temCliente
          ? "Veículo cadastrado e vinculado ao cliente com sucesso!"
          : "Veículo cadastrado sem cliente vinculado.",
      );
      setNovoVeiculo({
        placa: "",
        marca: "",
        modelo: "",
        ano: "",
        kmAtual: "",
        chassi: "",
        nomeProprietario: "",
        emailCliente: "",
        clienteId: "",
      });
      setExibirForm(false);
      await carregarTodosVeiculos();
    } catch (error) {
      console.error("Erro ao cadastrar veículo:", error);
      setErro(
        error.response?.data?.message ||
          "Erro ao cadastrar veículo. Verifique a placa e se o e-mail/ID do cliente existe.",
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
      const response = await api.get(`/veiculos/${veiculo.id}/historico`);
      setHistorico(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    } finally {
      setCarregandoHistorico(false);
    }
  }

  const veiculosFiltrados = veiculos.filter((v) => {
    const termo = busca.toLowerCase();
    return (
      v.placa?.toLowerCase().includes(termo) ||
      v.marca?.toLowerCase().includes(termo) ||
      v.modelo?.toLowerCase().includes(termo) ||
      v.cliente?.nome?.toLowerCase().includes(termo) ||
      v.nomeProprietario?.toLowerCase().includes(termo)
    );
  });

  return (
    <DashboardLayout
      titulo="Gestão de Veículos"
      subtitulo="Controle toda a frota atendida pela oficina e vincule veículos aos clientes."
    >
      <div className="veiculos-pagina">
        <section className="veiculos-topo">
          <div>
            <span className="veiculos-eyebrow">GESTÃO DA OFICINA</span>
            <h2>Frota Geral de Veículos ({veiculos.length})</h2>
            <p>
              Visualize todos os veículos cadastrados por clientes ou pela
              equipe e cadastre novos carros vinculando pelo e-mail do cliente.
            </p>
          </div>

          <div className="veiculos-acoes-topo">
            <button
              type="button"
              className="veiculos-btn veiculos-btn-secundario"
              onClick={carregarTodosVeiculos}
              disabled={carregando}
            >
              ↻ Atualizar
            </button>
            <button
              type="button"
              className="veiculos-btn veiculos-btn-primario"
              onClick={() => setExibirForm((ativo) => !ativo)}
            >
              {exibirForm ? "Cancelar" : "+ Novo Veículo"}
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
                  <span className="veiculos-eyebrow">GESTÃO DA OFICINA</span>
                  <h3>Cadastrar Veículo para Cliente</h3>
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
                    <label>E-mail do Cliente</label>
                    <input
                      type="email"
                      placeholder="cliente@email.com"
                      value={novoVeiculo.emailCliente}
                      onChange={(e) =>
                        setNovoVeiculo({
                          ...novoVeiculo,
                          emailCliente: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="veiculos-campo">
                    <label>Ou ID do Cliente</label>
                    <input
                      type="number"
                      placeholder="Opcional"
                      value={novoVeiculo.clienteId}
                      onChange={(e) =>
                        setNovoVeiculo({
                          ...novoVeiculo,
                          clienteId: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="veiculos-campo">
                    <label>Nome do proprietário (se não tiver cadastro)</label>
                    <input
                      type="text"
                      placeholder="Ex: José da Silva"
                      value={novoVeiculo.nomeProprietario}
                      onChange={(e) =>
                        setNovoVeiculo({
                          ...novoVeiculo,
                          nomeProprietario: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="veiculos-campo">
                    <label>Placa *</label>
                    <input
                      type="text"
                      placeholder="ABC1D23"
                      maxLength={8}
                      required
                      value={novoVeiculo.placa}
                      onChange={(e) =>
                        setNovoVeiculo({
                          ...novoVeiculo,
                          placa: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="veiculos-campo">
                    <label>Marca *</label>
                    <input
                      type="text"
                      placeholder="Ex: Fiat"
                      required
                      value={novoVeiculo.marca}
                      onChange={(e) =>
                        setNovoVeiculo({
                          ...novoVeiculo,
                          marca: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="veiculos-campo">
                    <label>Modelo *</label>
                    <input
                      type="text"
                      placeholder="Ex: Palio Fire"
                      required
                      value={novoVeiculo.modelo}
                      onChange={(e) =>
                        setNovoVeiculo({
                          ...novoVeiculo,
                          modelo: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="veiculos-campo">
                    <label>Ano</label>
                    <input
                      type="number"
                      placeholder="Ex: 2015"
                      value={novoVeiculo.ano}
                      onChange={(e) =>
                        setNovoVeiculo({ ...novoVeiculo, ano: e.target.value })
                      }
                    />
                  </div>

                  <div className="veiculos-campo">
                    <label>KM Atual</label>
                    <input
                      type="number"
                      placeholder="Ex: 82000"
                      value={novoVeiculo.kmAtual}
                      onChange={(e) =>
                        setNovoVeiculo({
                          ...novoVeiculo,
                          kmAtual: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="veiculos-campo">
                    <label>Chassi</label>
                    <input
                      type="text"
                      placeholder="Opcional"
                      value={novoVeiculo.chassi}
                      onChange={(e) =>
                        setNovoVeiculo({
                          ...novoVeiculo,
                          chassi: e.target.value,
                        })
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
                    {salvando ? "Salvando..." : "Cadastrar Veículo"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="veiculos-barra-busca">
          <input
            type="text"
            className="veiculos-input-busca"
            placeholder="Buscar por placa, marca, modelo ou nome do proprietário..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {carregando ? (
          <div className="veiculos-vazio">Carregando frota da oficina...</div>
        ) : veiculosFiltrados.length === 0 ? (
          <div className="veiculos-vazio">
            <strong>Nenhum veículo encontrado.</strong>
          </div>
        ) : (
          <div className="veiculos-grid">
            {veiculosFiltrados.map((v) => (
              <article className="veiculo-card" key={v.id}>
                <div>
                  <div className="veiculo-card-topo">
                    <span className="veiculo-placa-badge">{v.placa}</span>
                    <span className="veiculo-ano-badge">
                      ID #{v.id} · Ano {v.ano || "N/I"}
                    </span>
                  </div>

                  <div className="veiculo-card-corpo">
                    <strong>
                      {v.marca || "Marca"} {v.modelo || "Modelo"}
                    </strong>
                    <div className="veiculo-detalhes-lista">
                      <span>
                        Proprietário:{" "}
                        <strong>
                          {v.cliente?.nome ||
                            (v.nomeProprietario
                              ? `${v.nomeProprietario} (sem cadastro)`
                              : "Sem proprietário")}
                        </strong>
                      </span>
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
                  ▤ Histórico de OS
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
                <span className="veiculos-eyebrow">HISTÓRICO DO VEÍCULO</span>
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
