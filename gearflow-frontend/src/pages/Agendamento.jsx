import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import api from "../services/api";
import "./Agendamento.css";

function dataLocalHoje() {
  const agora = new Date();
  const local = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function dataLegivel(valor) {
  if (!valor) return "A definir";
  const [ano, mes, dia] = valor.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(ano, mes - 1, dia));
}

export default function AgendamentoCliente() {
  const navigate = useNavigate();
  const [veiculos, setVeiculos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [carregandoVeiculos, setCarregandoVeiculos] = useState(true);
  const [buscandoHorarios, setBuscandoHorarios] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [erroHorarios, setErroHorarios] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [form, setForm] = useState({ veiculoId: "", dataAgendamento: "", horario: "", motivo: "" });
  const hoje = dataLocalHoje();

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        const { data } = await api.get("/veiculos/meus");
        if (!ativo) return;
        const lista = Array.isArray(data) ? data : [];
        setVeiculos(lista);
        if (lista.length === 1) setForm((anterior) => ({ ...anterior, veiculoId: String(lista[0].id) }));
      } catch {
        if (ativo) setErro("Não foi possível carregar seus veículos. Tente atualizar a página.");
      } finally {
        if (ativo) setCarregandoVeiculos(false);
      }
    }
    carregar();
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    if (!form.dataAgendamento) {
      setHorarios([]);
      setErroHorarios("");
      setBuscandoHorarios(false);
      return;
    }
    const controller = new AbortController();
    setHorarios([]);
    setErroHorarios("");
    setBuscandoHorarios(true);
    setForm((anterior) => ({ ...anterior, horario: "" }));
    async function buscar() {
      try {
        const { data } = await api.get("/agendamentos/horarios-disponiveis", {
          params: { data: form.dataAgendamento }, signal: controller.signal,
        });
        if (!controller.signal.aborted) setHorarios(Array.isArray(data) ? data : []);
      } catch {
        if (!controller.signal.aborted) setErroHorarios("Não foi possível consultar os horários. Selecione outra data ou tente novamente.");
      } finally {
        if (!controller.signal.aborted) setBuscandoHorarios(false);
      }
    }
    buscar();
    return () => controller.abort();
  }, [form.dataAgendamento]);

  const veiculoSelecionado = useMemo(
    () => veiculos.find((veiculo) => String(veiculo.id) === String(form.veiculoId)),
    [veiculos, form.veiculoId]
  );
  const podeEnviar = Boolean(form.veiculoId && form.dataAgendamento && form.horario && !salvando && !buscandoHorarios);

  async function enviar(evento) {
    evento.preventDefault();
    if (!podeEnviar) return;
    setErro("");
    setSalvando(true);
    try {
      await api.post("/agendamentos/meus", {
        veiculo: { id: Number(form.veiculoId) },
        dataAgendamento: form.dataAgendamento,
        horario: form.horario,
        motivo: form.motivo.trim(),
      });
      setSucesso(true);
    } catch (error) {
      const mensagem = error.response?.data?.message;
      setErro(typeof mensagem === "string" ? mensagem : "Não foi possível enviar a solicitação. O horário pode ter sido ocupado; confira a disponibilidade e tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  function atualizar(campo, valor) {
    setErro("");
    setForm((anterior) => ({ ...anterior, [campo]: valor }));
  }

  return (
    <DashboardLayout tipoUsuario="CLIENTE" titulo="Agendar consulta" subtitulo="Escolha um horário para atendimento do seu veículo.">
      <main className="agendar-page">
        <header className="agendar-hero">
          <div>
            <span className="agendar-kicker">AGENDAMENTO ONLINE</span>
            <h2>{sucesso ? "Solicitação enviada!" : "Vamos cuidar do seu veículo?"}</h2>
            <p>{sucesso ? "A oficina recebeu seu pedido de agendamento." : "Em poucos passos, escolha o veículo, encontre um horário e conte o que precisa."}</p>
          </div>
          <div className="agendar-hero-mark" aria-hidden="true">✦</div>
        </header>

        {sucesso ? (
          <section className="agendar-success" role="status">
            <div className="agendar-success-icon" aria-hidden="true">✓</div>
            <h3>Agendamento solicitado com sucesso</h3>
            <p>Seu pedido foi enviado. Aguarde a análise e aprovação da oficina; o envio não significa que o horário já foi confirmado.</p>
            <div className="agendar-success-details">
              <span><small>Veículo</small><strong>{veiculoSelecionado ? `${veiculoSelecionado.marca} ${veiculoSelecionado.modelo} · ${veiculoSelecionado.placa}` : "Veículo selecionado"}</strong></span>
              <span><small>Data</small><strong>{dataLegivel(form.dataAgendamento)}</strong></span>
              <span><small>Horário</small><strong>{form.horario}</strong></span>
            </div>
            <button className="agendar-primary" type="button" onClick={() => navigate("/DashboardCliente")}>Voltar à visão geral</button>
          </section>
        ) : carregandoVeiculos ? (
          <section className="agendar-state" role="status">Carregando seus veículos e preparando o formulário...</section>
        ) : veiculos.length === 0 ? (
          <section className="agendar-state">
            <div className="agendar-state-icon" aria-hidden="true">🚗</div>
            <h3>Cadastre um veículo primeiro</h3>
            <p>Para agendar um atendimento, você precisa ter pelo menos um veículo cadastrado.</p>
            {erro && <p className="agendar-error" role="alert">{erro}</p>}
            <button type="button" className="agendar-primary" onClick={() => navigate("/cliente/veiculos")}>Ir para Meus Veículos</button>
          </section>
        ) : (
          <div className="agendar-layout">
            <form className="agendar-form" onSubmit={enviar}>
              {erro && <div className="agendar-error" role="alert">{erro}</div>}

              <section className="agendar-section">
                <div className="agendar-section-head"><span className="agendar-step">01</span><div><h3>Qual veículo será atendido?</h3><p>Selecione um dos veículos cadastrados na sua conta.</p></div></div>
                <div className="agendar-vehicle-grid" role="group" aria-label="Selecione um veículo">
                  {veiculos.map((veiculo) => (
                    <label key={veiculo.id} className={`agendar-vehicle ${String(form.veiculoId) === String(veiculo.id) ? "is-selected" : ""}`}>
                      <input type="radio" name="veiculo" value={veiculo.id} checked={String(form.veiculoId) === String(veiculo.id)} onChange={() => atualizar("veiculoId", String(veiculo.id))} required />
                      <span className="agendar-vehicle-symbol" aria-hidden="true">🚘</span>
                      <span className="agendar-vehicle-info"><strong>{veiculo.marca} {veiculo.modelo}</strong><small>Placa {veiculo.placa || "não informada"}</small></span>
                      <span className="agendar-check" aria-hidden="true">✓</span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="agendar-section">
                <div className="agendar-section-head"><span className="agendar-step">02</span><div><h3>Quando você deseja vir?</h3><p>Escolha uma data e selecione um dos horários disponíveis.</p></div></div>
                <label className="agendar-field" htmlFor="agendar-data"><span>Data desejada <b>*</b></span><input id="agendar-data" type="date" min={hoje} value={form.dataAgendamento} onChange={(e) => atualizar("dataAgendamento", e.target.value)} required /></label>
                <div className="agendar-time-head"><strong>Horários disponíveis</strong>{form.dataAgendamento && !buscandoHorarios && !erroHorarios && <small>{horarios.length} opções</small>}</div>
                {!form.dataAgendamento ? <div className="agendar-hint">Selecione uma data para visualizar os horários.</div>
                  : buscandoHorarios ? <div className="agendar-hint" role="status">Consultando horários disponíveis...</div>
                  : erroHorarios ? <div className="agendar-error" role="alert">{erroHorarios}</div>
                  : horarios.length === 0 ? <div className="agendar-hint">Não há horários disponíveis nessa data. Experimente outro dia.</div>
                  : <div className="agendar-times" role="group" aria-label="Escolha o horário">
                    {horarios.map((hora) => {
                      const horario = String(hora).slice(0, 5);
                      return <label key={String(hora)} className={`agendar-time ${form.horario === horario ? "is-selected" : ""}`}>
                        <input type="radio" name="horario" value={horario} checked={form.horario === horario} onChange={() => atualizar("horario", horario)} required />{horario}
                      </label>;
                    })}
                  </div>}
              </section>

              <section className="agendar-section">
                <div className="agendar-section-head"><span className="agendar-step">03</span><div><h3>Como podemos ajudar?</h3><p>Conte brevemente o motivo da visita. Esse campo é opcional.</p></div></div>
                <label className="agendar-field" htmlFor="agendar-motivo"><span>Descrição do serviço ou problema</span><textarea id="agendar-motivo" rows={5} maxLength={1000} placeholder="Ex.: revisão preventiva, troca de óleo, barulho ao frear..." value={form.motivo} onChange={(e) => atualizar("motivo", e.target.value)} /><small className="agendar-character-count">{form.motivo.length}/1000 caracteres</small></label>
              </section>

              <div className="agendar-form-actions"><button className="agendar-secondary" type="button" onClick={() => navigate("/DashboardCliente")} disabled={salvando}>Voltar</button><button className="agendar-primary" type="submit" disabled={!podeEnviar}>{salvando ? "Enviando solicitação..." : "Solicitar agendamento"}</button></div>
            </form>

            <aside className="agendar-aside" aria-label="Resumo do agendamento">
              <section className="agendar-summary"><span className="agendar-summary-kicker">RESUMO</span><h3>Seu agendamento</h3><p>Confira as informações antes de enviar.</p>
                <div className="agendar-summary-row"><span>Veículo</span><strong>{veiculoSelecionado ? `${veiculoSelecionado.marca} ${veiculoSelecionado.modelo}` : "Não selecionado"}</strong>{veiculoSelecionado && <small>{veiculoSelecionado.placa}</small>}</div>
                <div className="agendar-summary-row"><span>Data</span><strong>{dataLegivel(form.dataAgendamento)}</strong></div>
                <div className="agendar-summary-row"><span>Horário</span><strong>{form.horario || "A definir"}</strong></div>
                <div className="agendar-summary-note"><strong>Como funciona?</strong><p>Após o envio, a oficina analisará a solicitação. Aguarde a confirmação do atendimento.</p></div>
              </section>
            </aside>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
