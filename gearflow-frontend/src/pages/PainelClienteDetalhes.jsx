import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CarFront,
  ClipboardList,
  ShieldCheck,
  UserRound,
  ArrowUpRight,
  RefreshCw,
  Wrench,
  Clock3,
  CheckCircle2,
  Mail,
  Phone,
  IdCard,
} from "lucide-react";
import api from "../services/api";
import "./PainelClienteDetalhes.css";

const dataBR = (value) => {
  if (!value) return "Sem data";
  const d = String(value).slice(0, 10).split("-");
  return d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}` : String(value);
};
const labelStatus = (value) =>
  ({
    ABERTA: "Aberta",
    EM_ANALISE: "Em análise",
    AGUARDANDO_APROVACAO: "Aguardando aprovação",
    EM_EXECUCAO: "Em execução",
    FINALIZADA: "Finalizada",
    CANCELADA: "Cancelada",
  })[value] || (value ? String(value).replaceAll("_", " ") : "Não informado");
const nomeCarro = (v) =>
  typeof v === "string"
    ? v
    : [v?.marca, v?.modelo, v?.ano].filter(Boolean).join(" ") ||
      "Veículo cadastrado";
function CartaoMetrica({ Icone, titulo, numero, detalhe }) {
  return (
    <article className="gfp-metrica">
      <div className="gfp-metrica-topo">
        <span>{titulo}</span>
        <Icone size={20} />
      </div>
      <strong>{numero}</strong>
      <small>{detalhe}</small>
    </article>
  );
}
export default function PainelClienteDetalhes({
  ordens = [],
  veiculos = [],
  agendamentos = [],
  carregando = false,
}) {
  const navigate = useNavigate();
  const [conta, setConta] = useState(null);
  const [erroConta, setErroConta] = useState("");
  const [carregandoConta, setCarregandoConta] = useState(true);
  async function atualizarConta() {
    setCarregandoConta(true);
    setErroConta("");
    try {
      const { data } = await api.get("/auth/session");
      // Suporta as estruturas de sessão existentes sem supor que todos os campos estejam presentes.
      setConta(data?.usuario || data?.cliente || data?.user || data || null);
    } catch (e) {
      setConta(null);
      setErroConta(
        e.response?.status === 401
          ? "Sua sessão expirou. Entre novamente."
          : "Dados da conta indisponíveis no momento.",
      );
    } finally {
      setCarregandoConta(false);
    }
  }
  useEffect(() => {
    let ativo = true;
    api
      .get("/auth/session")
      .then(({ data }) => {
        if (ativo)
          setConta(
            data?.usuario || data?.cliente || data?.user || data || null,
          );
      })
      .catch((e) => {
        if (ativo)
          setErroConta(
            e.response?.status === 401
              ? "Sessão expirada."
              : "Informações pessoais indisponíveis.",
          );
      })
      .finally(() => {
        if (ativo) setCarregandoConta(false);
      });
    return () => {
      ativo = false;
    };
  }, []);
  const primeiro = String(conta?.nome || "Cliente")
    .trim()
    .split(/\s+/)[0];
  const ativas = ordens.filter(
    (o) => !["FINALIZADA", "CANCELADA"].includes(o.status),
  );
  const aguardando = ordens.filter(
    (o) => o.status === "AGUARDANDO_APROVACAO",
  ).length;
  const concluidas = ordens.filter((o) => o.status === "FINALIZADA").length;
  const proximos = [...agendamentos].filter(
    (a) => !["CANCELADO", "RECUSADO"].includes(a.status),
  );
  const recentes = [...ordens]
    .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
    .slice(0, 3);
  return (
    <section
      className="gfp-painel"
      aria-label="Central de informações do cliente"
    >
      <div className="gfp-boasvindas">
        <div>
          <span className="gfp-overline">CENTRAL DO CLIENTE</span>
          <h2>Seu painel, {primeiro}.</h2>
          <p>
            As informações da sua oficina, organizadas para você acompanhar cada
            etapa.
          </p>
        </div>
        <button type="button" onClick={() => navigate("/cliente/agendamentos")}>
          <CalendarDays size={17} /> Agendar consulta <ArrowUpRight size={17} />
        </button>
      </div>
      <div className="gfp-metricas">
        <CartaoMetrica
          Icone={CarFront}
          titulo="Veículos"
          numero={veiculos.length}
          detalhe="Cadastrados"
        />
        <CartaoMetrica
          Icone={Wrench}
          titulo="Em atendimento"
          numero={ativas.length}
          detalhe="Ordens não finalizadas"
        />
        <CartaoMetrica
          Icone={Clock3}
          titulo="Aprovações"
          numero={aguardando}
          detalhe="Precisam da sua decisão"
        />
        <CartaoMetrica
          Icone={CheckCircle2}
          titulo="Concluídos"
          numero={concluidas}
          detalhe="Serviços finalizados"
        />
      </div>
      <div className="gfp-colunas">
        <article className="gfp-card gfp-cadastro">
          <div className="gfp-cabecalho">
            <div className="gfp-titulo-icone">
              <UserRound size={20} />
            </div>
            <div>
              <span className="gfp-overline">IDENTIFICAÇÃO</span>
              <h3>Seus dados cadastrais</h3>
            </div>
            <span className="gfp-somente-leitura">
              <ShieldCheck size={14} /> Consulta
            </span>
          </div>
          {erroConta ? (
            <p className="gfp-aviso" role="status">
              {erroConta}
            </p>
          ) : carregandoConta ? (
            <p className="gfp-aviso">Carregando dados da conta...</p>
          ) : (
            <div className="gfp-dados">
              <div>
                <UserRound size={17} />
                <span>Nome completo</span>
                <strong>{conta?.nome || "Não disponível"}</strong>
              </div>
              <div>
                <Mail size={17} />
                <span>E-mail</span>
                <strong>{conta?.email || "Não disponível"}</strong>
              </div>
              <div>
                <Phone size={17} />
                <span>Telefone</span>
                <strong>{conta?.telefone || "Solicite à oficina"}</strong>
              </div>
              <div>
                <IdCard size={17} />
                <span>CPF</span>
                <strong>
                  {conta?.cpf
                    ? `•••.•••.•••-${String(conta.cpf).replace(/\D/g, "").slice(-2)}`
                    : "Dados protegidos"}
                </strong>
              </div>
            </div>
          )}
          <div className="gfp-nota">
            <ShieldCheck size={18} />
            <span>
              Alterações cadastrais devem ser solicitadas à oficina e realizadas
              por pessoal autorizado.
            </span>
          </div>
          <button
            className="gfp-link"
            type="button"
            onClick={() => navigate("/meu-perfil")}
          >
            Consultar meu perfil <ArrowUpRight size={16} />
          </button>
        </article>
        <article className="gfp-card">
          <div className="gfp-cabecalho">
            <div className="gfp-titulo-icone">
              <CarFront size={20} />
            </div>
            <div>
              <span className="gfp-overline">GARAGEM</span>
              <h3>Meus veículos</h3>
            </div>
          </div>
          <div className="gfp-listagem">
            {veiculos.length ? (
              veiculos.slice(0, 3).map((v, i) => (
                <div className="gfp-linha" key={v?.id ?? i}>
                  <span className="gfp-linha-icone">
                    <CarFront size={19} />
                  </span>
                  <div>
                    <strong>{nomeCarro(v)}</strong>
                    <small>{v?.placa || "Placa não informada"}</small>
                  </div>
                </div>
              ))
            ) : (
              <p className="gfp-vazio">
                Nenhum veículo disponível para consulta.
              </p>
            )}
          </div>
          <button
            className="gfp-link"
            type="button"
            onClick={() => navigate("/cliente/veiculos")}
          >
            Visualizar garagem <ArrowUpRight size={16} />
          </button>
        </article>
      </div>
      <div className="gfp-colunas">
        <article className="gfp-card">
          <div className="gfp-cabecalho">
            <div className="gfp-titulo-icone">
              <ClipboardList size={20} />
            </div>
            <div>
              <span className="gfp-overline">ACOMPANHAMENTO</span>
              <h3>Últimas ordens de serviço</h3>
            </div>
          </div>
          <div className="gfp-listagem">
            {carregando ? (
              <p className="gfp-vazio">Carregando...</p>
            ) : recentes.length ? (
              recentes.map((o) => (
                <div className="gfp-linha" key={o.id}>
                  <span className="gfp-linha-icone">
                    <Wrench size={19} />
                  </span>
                  <div>
                    <strong>
                      OS #{o.id} · {nomeCarro(o.veiculo)}
                    </strong>
                    <small>
                      {dataBR(o.dataEntrada)} · {labelStatus(o.status)}
                    </small>
                  </div>
                  <span
                    className={`gfp-status ${o.status === "FINALIZADA" ? "concluida" : ""}`}
                  >
                    {o.status === "FINALIZADA"
                      ? "Finalizada"
                      : "Em acompanhamento"}
                  </span>
                </div>
              ))
            ) : (
              <p className="gfp-vazio">Nenhuma ordem registrada.</p>
            )}
          </div>
          <button
            className="gfp-link"
            type="button"
            onClick={() => navigate("/minhas-os")}
          >
            Ver todas as ordens <ArrowUpRight size={16} />
          </button>
        </article>
        <article className="gfp-card">
          <div className="gfp-cabecalho">
            <div className="gfp-titulo-icone">
              <CalendarDays size={20} />
            </div>
            <div>
              <span className="gfp-overline">AGENDA</span>
              <h3>Meus agendamentos</h3>
            </div>
          </div>
          <div className="gfp-listagem">
            {proximos.length ? (
              proximos.slice(0, 3).map((a, i) => (
                <div className="gfp-linha" key={a?.id ?? i}>
                  <span className="gfp-linha-icone">
                    <CalendarDays size={19} />
                  </span>
                  <div>
                    <strong>
                      {dataBR(a.data || a.dataAgendamento || a.dataConsulta)}
                    </strong>
                    <small>
                      {labelStatus(a.status)}
                      {a.horario ? ` · ${a.horario}` : ""}
                    </small>
                  </div>
                </div>
              ))
            ) : (
              <p className="gfp-vazio">Sem agendamentos ativos no momento.</p>
            )}
          </div>
          <button
            className="gfp-link"
            type="button"
            onClick={() => navigate("/cliente/agendamentos")}
          >
            Abrir agenda <ArrowUpRight size={16} />
          </button>
        </article>
      </div>
      <div className="gfp-ajuda">
        <ShieldCheck size={20} />
        <span>
          Informações consultivas, sincronizadas com o GearFlow. Seus dados
          pessoais só podem ser atualizados pela equipe autorizada da oficina.
        </span>
        <button
          type="button"
          onClick={atualizarConta}
          disabled={carregandoConta}
        >
          <RefreshCw size={16} /> Atualizar meus dados
        </button>
      </div>
    </section>
  );
}
