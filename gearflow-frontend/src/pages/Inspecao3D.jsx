import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import api from "../services/api";
import "./Inspecao3D.css";

const carregarModulo3D = () => import("../components/CarroInterativo3D");
const CarroInterativo3D = lazy(carregarModulo3D);
const GRAVIDADES = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  CRITICA: "Crítica",
};
const ORDEM_GRAVIDADE = { CRITICA: 0, ALTA: 1, MEDIA: 2, BAIXA: 3 };
const AMOSTRAS = [
  {
    id: "demo-1",
    regiao: "MOTOR",
    titulo: "Análise do conjunto do motor",
    gravidade: "ALTA",
    descricao:
      "Exemplo didático: o mecânico poderá indicar aqui um problema identificado no motor.",
    resolvido: false,
  },
  {
    id: "demo-2",
    regiao: "FREIOS_DIANTEIROS",
    titulo: "Verificação das pastilhas",
    gravidade: "MEDIA",
    descricao: "Exemplo didático: ponto de inspeção dos freios dianteiros.",
    resolvido: false,
  },
];
const FORM_INICIAL = {
  regiao: "MOTOR",
  gravidade: "MEDIA",
  titulo: "",
  descricao: "",
};

function textoErro(erro, padrao) {
  if (erro.response?.status === 401)
    return "Sessão expirada. Faça login novamente.";
  if (erro.response?.status === 403)
    return "Você não tem permissão para acessar esta inspeção.";
  if (erro.response?.status === 404)
    return "A ordem de serviço não foi encontrada.";
  const mensagem = erro.response?.data?.message || erro.response?.data?.detail;
  return typeof mensagem === "string" && mensagem.length < 240
    ? mensagem
    : padrao;
}

function formatarData(data) {
  if (!data) return "—";
  const [ano, mes, dia] = data.slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : data;
}

function nomeVeiculo(os) {
  if (!os) return "Hatch compacto ilustrativo";
  if (typeof os.veiculo === "string") return os.veiculo;
  return (
    [os.veiculo?.marca, os.veiculo?.modelo].filter(Boolean).join(" ") ||
    "Veículo"
  );
}

function placaVeiculo(os) {
  return os?.placa || os?.veiculo?.placa || "Placa não informada";
}

class LimiteVisualizador extends Component {
  constructor(props) {
    super(props);
    this.state = { falhou: false };
  }
  static getDerivedStateFromError() {
    return { falhou: true };
  }
  componentDidCatch(erro) {
    console.error("Falha no visualizador 3D", erro);
  }
  render() {
    return this.state.falhou ? (
      <div className="insp3d-fallback" role="alert">
        <strong>O visualizador 3D não pôde ser iniciado.</strong>
        <p>
          Verifique o suporte a WebGL no navegador. Os diagnósticos continuam
          disponíveis na lista ao lado.
        </p>
      </div>
    ) : (
      this.props.children
    );
  }
}

export default function Inspecao3D({ tipoUsuario = "CLIENTE" }) {
  const cliente = tipoUsuario === "CLIENTE";
  const navigate = useNavigate();
  const { ordemId } = useParams();
  const [regioes3D, setRegioes3D] = useState({});
  const [ordens, setOrdens] = useState([]);
  const [carregandoLista, setCarregandoLista] = useState(true);
  const [erroLista, setErroLista] = useState("");
  const [inspecao, setInspecao] = useState(null);
  const [carregandoInspecao, setCarregandoInspecao] = useState(false);
  const [erroInspecao, setErroInspecao] = useState("");
  const [selecionada, setSelecionada] = useState("MOTOR");
  const [vista, setVista] = useState("geral");
  const [capoAberto, setCapoAberto] = useState(false);
  const [portasAbertas, setPortasAbertas] = useState(false);
  const [raioX, setRaioX] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [erroAcao, setErroAcao] = useState("");

  useEffect(() => {
    let ativo = true;
    carregarModulo3D()
      .then((modulo) => {
        if (ativo) setRegioes3D(modulo.REGIOES_3D || {});
      })
      .catch((erro) => console.error("Falha ao carregar regiões 3D", erro));
    return () => { ativo = false; };
  }, []);

  const prefixo = cliente ? "/cliente/inspecao-3d" : "/inspecao-3d";
  const osSelecionada = useMemo(
    () => ordens.find((os) => String(os.id) === String(ordemId)),
    [ordens, ordemId],
  );
  const demonstracao = !ordemId;
  const anotacoes = useMemo(
    () => (demonstracao ? AMOSTRAS : inspecao?.anotacoes || []),
    [demonstracao, inspecao],
  );
  const pendentes = anotacoes.filter((a) => !a.resolvido);
  const registrosOrdenados = useMemo(
    () =>
      [...anotacoes].sort(
        (a, b) =>
          Number(a.resolvido) - Number(b.resolvido) ||
          (ORDEM_GRAVIDADE[a.gravidade] ?? 4) -
            (ORDEM_GRAVIDADE[b.gravidade] ?? 4),
      ),
    [anotacoes],
  );

  const selecionarRegiao = useCallback((codigo) => {
    setSelecionada(codigo);
    setVista("detalhe");
    if (["MOTOR", "ARREFECIMENTO", "BATERIA"].includes(codigo))
      setCapoAberto(true);
    if (codigo === "TRANSMISSAO" || codigo === "ESCAPAMENTO") setRaioX(true);
  }, []);

  useEffect(() => {
    let ativo = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCarregandoLista(true);
    api
      .get(cliente ? "/ordens-servico/minhas" : "/ordens-servico")
      .then((res) => {
        if (!ativo) return;
        const lista = Array.isArray(res.data) ? res.data : [];
        setOrdens(lista);
        setErroLista("");
        // Não selecionar uma OS alheia se a URL já especifica uma OS.
        if (!ordemId && lista.length)
          navigate(`${prefixo}/${lista[0].id}`, { replace: true });
      })
      .catch((erro) => {
        if (ativo)
          setErroLista(
            textoErro(erro, "Não foi possível listar as ordens de serviço."),
          );
      })
      .finally(() => {
        if (ativo) setCarregandoLista(false);
      });
    return () => {
      ativo = false;
    };
  }, [cliente, navigate, prefixo, ordemId]);

  const buscarInspecao = useCallback(async () => {
    if (!ordemId) {
      setInspecao(null);
      setErroInspecao("");
      return;
    }
    setCarregandoInspecao(true);
    setInspecao(null);
    setErroInspecao("");
    try {
      const resposta = await api.get(`/ordens-servico/${ordemId}/inspecao3d`);
      setInspecao(resposta.data);
    } catch (erro) {
      setInspecao(null);
      setErroInspecao(
        textoErro(erro, "Não foi possível carregar o diagnóstico 3D."),
      );
    } finally {
      setCarregandoInspecao(false);
    }
  }, [ordemId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    buscarInspecao();
  }, [buscarInspecao]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMensagem("");
    setErroAcao("");
  }, [ordemId]);

  async function registrar(evento) {
    evento.preventDefault();
    if (!ordemId || cliente || enviando) return;
    setEnviando(true);
    setMensagem("");
    setErroAcao("");
    try {
      await api.post(`/ordens-servico/${ordemId}/inspecao3d/anotacoes`, form);
      setForm(FORM_INICIAL);
      setMensagem("Diagnóstico registrado. Já está disponível para o cliente.");
      await buscarInspecao();
    } catch (erro) {
      setErroAcao(textoErro(erro, "Não foi possível registrar o diagnóstico."));
    } finally {
      setEnviando(false);
    }
  }

  async function alterarResolucao(anotacao) {
    if (cliente || editandoId) return;
    setEditandoId(anotacao.id);
    setMensagem("");
    setErroAcao("");
    try {
      await api.patch(
        `/ordens-servico/${ordemId}/inspecao3d/anotacoes/${anotacao.id}`,
        { resolvido: !anotacao.resolvido },
      );
      await buscarInspecao();
      setMensagem(
        anotacao.resolvido
          ? "Apontamento reaberto."
          : "Apontamento marcado como resolvido.",
      );
    } catch (erro) {
      setErroAcao(textoErro(erro, "Não foi possível atualizar o apontamento."));
    } finally {
      setEditandoId(null);
    }
  }

  const foco = regioes3D[selecionada];
  const anotacoesDaRegiao = registrosOrdenados.filter(
    (item) => item.regiao === selecionada,
  );
  const desabilitarCadastro =
    !ordemId ||
    cliente ||
    inspecao?.statusOS === "FINALIZADA" ||
    !!erroInspecao;

  return (
    <DashboardLayout
      tipoUsuario={tipoUsuario}
      titulo="Inspeção 3D"
      subtitulo="Explore os componentes do veículo e acompanhe os diagnósticos vinculados à ordem de serviço."
    >
      <div className="insp3d-page">
        <div className="insp3d-intro">
          <div>
            <span className="insp3d-kicker">GEARFLOW / DIAGNÓSTICO VISUAL</span>
            <h2>Entenda o que acontece com o seu veículo.</h2>
            <p>
              Gire o carro, abra o capô, explore o assoalho e selecione um ponto
              para ver as informações da oficina.
            </p>
          </div>
          <div className="insp3d-mode-label">
            {cliente ? "PORTAL DO CLIENTE" : "ÁREA TÉCNICA"}
          </div>
        </div>

        <section
          className="insp3d-picker"
          aria-label="Ordem de serviço a inspecionar"
        >
          <label htmlFor="insp3d-ordem">Ordem de serviço</label>
          <select
            id="insp3d-ordem"
            value={ordemId || ""}
            disabled={carregandoLista || ordens.length === 0}
            onChange={(evento) =>
              navigate(
                evento.target.value
                  ? `${prefixo}/${evento.target.value}`
                  : prefixo,
              )
            }
          >
            {!ordemId && <option value="">Demonstração interativa</option>}
            {ordens.map((os) => (
              <option key={os.id} value={os.id}>
                OS #{os.id} • {nomeVeiculo(os)} • {placaVeiculo(os)}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="insp3d-button subtle"
            disabled={!ordemId || carregandoInspecao}
            onClick={buscarInspecao}
          >
            ↻ Atualizar
          </button>
        </section>

        {erroLista && (
          <p role="alert" className="insp3d-alert error">
            {erroLista}
          </p>
        )}
        {erroInspecao && (
          <p role="alert" className="insp3d-alert error">
            {erroInspecao}
          </p>
        )}
        {demonstracao && (
          <p className="insp3d-alert demo">
            <strong>Demonstração:</strong> os alertas exibidos são fictícios e
            não representam um diagnóstico do seu carro. Selecione uma ordem
            para visualizar dados reais.
          </p>
        )}
        {carregandoLista && (
          <p className="insp3d-alert">Buscando ordens de serviço...</p>
        )}

        <section className="insp3d-summary" aria-label="Resumo da inspeção">
          <div className="insp3d-car-summary">
            <span className="insp3d-car-icon">◈</span>
            <div>
              <span className="insp3d-label">VEÍCULO EM INSPEÇÃO</span>
              <strong>{nomeVeiculo(inspecao || osSelecionada)}</strong>
              <small>
                {placaVeiculo(inspecao || osSelecionada)}
                {osSelecionada?.dataEntrada
                  ? ` · Entrada ${formatarData(osSelecionada.dataEntrada)}`
                  : ""}
              </small>
            </div>
          </div>
          <div className="insp3d-numbers">
            <div>
              <strong>{carregandoInspecao ? "—" : anotacoes.length}</strong>
              <span>Observações</span>
            </div>
            <div>
              <strong>{carregandoInspecao ? "—" : pendentes.length}</strong>
              <span>Pendentes</span>
            </div>
            <div>
              <strong>
                {carregandoInspecao ? "—" : anotacoes.length - pendentes.length}
              </strong>
              <span>Resolvidas</span>
            </div>
          </div>
        </section>

        <div className="insp3d-workspace">
          <section
            className="insp3d-visual-panel"
            aria-label="Visualizador do carro"
          >
            <div className="insp3d-panel-header">
              <div>
                <span className="insp3d-kicker">EXPLORAÇÃO INTERATIVA</span>
                <h3>Seu carro em 3D</h3>
              </div>
              <span className="insp3d-live">
                <i /> Interativo
              </span>
            </div>
            <div className="insp3d-stage">
              <LimiteVisualizador>
                <Suspense
                  fallback={
                    <div className="insp3d-loading">
                      Preparando visualizador 3D...
                    </div>
                  }
                >
                  <CarroInterativo3D
                    anotacoes={anotacoes}
                    selecionada={selecionada}
                    onSelecionar={selecionarRegiao}
                    capoAberto={capoAberto}
                    portasAbertas={portasAbertas}
                    raioX={raioX}
                    vista={vista}
                  />
                </Suspense>
              </LimiteVisualizador>
              <div className="insp3d-view-legend">
                <span>Arraste para girar</span>
                <span>Role para aproximar</span>
                <span>Clique nos pontos</span>
              </div>
            </div>
            <div className="insp3d-controls" aria-label="Controles do carro">
              <button
                type="button"
                className={capoAberto ? "active" : ""}
                aria-pressed={capoAberto}
                onClick={() => {
                  setCapoAberto(!capoAberto);
                  setVista("geral");
                }}
              >
                {capoAberto ? "Fechar capô" : "Abrir capô"}
              </button>
              <button
                type="button"
                className={portasAbertas ? "active" : ""}
                aria-pressed={portasAbertas}
                onClick={() => {
                  setPortasAbertas(!portasAbertas);
                  setVista("lateral");
                }}
              >
                {portasAbertas ? "Fechar portas" : "Abrir portas"}
              </button>
              <button
                type="button"
                className={raioX ? "active" : ""}
                aria-pressed={raioX}
                onClick={() => setRaioX(!raioX)}
              >
                Modo raio X
              </button>
              <button
                type="button"
                className={vista === "inferior" ? "active" : ""}
                aria-pressed={vista === "inferior"}
                onClick={() =>
                  setVista(vista === "inferior" ? "geral" : "inferior")
                }
              >
                Vista inferior
              </button>
              <button
                type="button"
                onClick={() => {
                  setVista("geral");
                  setSelecionada(null);
                  setCapoAberto(false);
                  setPortasAbertas(false);
                  setRaioX(false);
                }}
              >
                Reiniciar vista
              </button>
            </div>
            <p className="insp3d-caveat">
              O carro 3D é uma representação esquemática de hatch compacto. A
              posição e a forma das peças são ilustrativas, não um diagrama
              técnico homologado para Chevrolet Onix ou outros modelos.
            </p>
          </section>

          <aside className="insp3d-side">
            <section className="insp3d-side-card">
              <div className="insp3d-side-title">
                <div>
                  <span className="insp3d-kicker">PEÇAS E REGIÕES</span>
                  <h3>Explore por componente</h3>
                </div>
                <span>{Object.keys(regioes3D).length}</span>
              </div>
              <div className="insp3d-region-list">
                {Object.entries(regioes3D).map(([codigo, item]) => {
                  const qtd = anotacoes.filter(
                    (a) => a.regiao === codigo && !a.resolvido,
                  ).length;
                  return (
                    <button
                      key={codigo}
                      type="button"
                      aria-pressed={selecionada === codigo}
                      className={`insp3d-region ${selecionada === codigo ? "selected" : ""}`}
                      onClick={() => selecionarRegiao(codigo)}
                    >
                      <span className="insp3d-region-dot" />
                      <span>{item.nome}</span>
                      {qtd > 0 ? (
                        <b className="insp3d-count">{qtd}</b>
                      ) : (
                        <span className="insp3d-region-chevron">›</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
            <section className="insp3d-side-card insp3d-focus-card">
              <span className="insp3d-kicker">COMPONENTE SELECIONADO</span>
              <h3>{foco?.nome || "Selecione uma peça"}</h3>
              <p>
                {foco
                  ? "Os pontos são referências visuais. Abaixo estão os registros da oficina para esta região."
                  : "Clique em um ponto no carro ou escolha uma região na lista."}
              </p>
              <div className="insp3d-focus-foot">
                {anotacoesDaRegiao.length}{" "}
                {anotacoesDaRegiao.length === 1
                  ? "registro nesta região"
                  : "registros nesta região"}
              </div>
            </section>
          </aside>
        </div>

        <section
          className="insp3d-diagnostics"
          aria-label="Diagnósticos vinculados à ordem"
        >
          <div className="insp3d-section-head">
            <div>
              <span className="insp3d-kicker">DIAGNÓSTICO DA OFICINA</span>
              <h3>Apontamentos e ocorrências</h3>
              <p>
                Selecione um registro para localizar sua região no carro 3D.
              </p>
            </div>
            <span className="insp3d-counter">{anotacoes.length} registros</span>
          </div>
          {inspecao?.diagnosticoGeral && (
            <div className="insp3d-general">
              <strong>Observação geral da OS</strong>
              <p>{inspecao.diagnosticoGeral}</p>
            </div>
          )}
          {carregandoInspecao ? (
            <p className="insp3d-empty">
              Carregando apontamentos da oficina...
            </p>
          ) : registrosOrdenados.length === 0 ? (
            <div className="insp3d-empty">
              <strong>Sem apontamentos 3D nesta ordem.</strong>
              <p>
                {cliente
                  ? "A oficina ainda não registrou ocorrências na inspeção visual."
                  : "Selecione uma região e registre o primeiro apontamento usando o formulário."}
              </p>
            </div>
          ) : (
            <div className="insp3d-diagnostic-grid">
              {registrosOrdenados.map((item) => (
                <article
                  className={`insp3d-diagnostic sev-${item.gravidade.toLowerCase()} ${item.resolvido ? "resolved" : ""}`}
                  key={item.id}
                >
                  <div className="insp3d-diagnostic-top">
                    <span className="insp3d-diagnostic-region">
                      {regioes3D[item.regiao]?.nome || item.regiao}
                    </span>
                    <span
                      className={`insp3d-severity ${item.resolvido ? "ok" : item.gravidade.toLowerCase()}`}
                    >
                      {item.resolvido
                        ? "Resolvido"
                        : GRAVIDADES[item.gravidade] || item.gravidade}
                    </span>
                  </div>
                  <h4>{item.titulo}</h4>
                  <p>{item.descricao}</p>
                  <div className="insp3d-diagnostic-actions">
                    <button
                      type="button"
                      onClick={() => selecionarRegiao(item.regiao)}
                    >
                      Localizar no 3D ↗
                    </button>
                    {!cliente && !demonstracao && (
                      <button
                        type="button"
                        disabled={editandoId === item.id}
                        onClick={() => alterarResolucao(item)}
                      >
                        {item.resolvido ? "Reabrir" : "Marcar resolvido"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {!cliente && (
          <section
            className="insp3d-create"
            aria-label="Registrar novo diagnóstico"
          >
            <div className="insp3d-section-head">
              <div>
                <span className="insp3d-kicker">OFICINA / REGISTRO</span>
                <h3>Adicionar apontamento</h3>
                <p>
                  O cliente poderá visualizar esse diagnóstico em sua ordem de
                  serviço.
                </p>
              </div>
            </div>
            {mensagem && (
              <p role="status" className="insp3d-alert success">
                {mensagem}
              </p>
            )}
            {erroAcao && (
              <p role="alert" className="insp3d-alert error">
                {erroAcao}
              </p>
            )}
            {inspecao?.statusOS === "FINALIZADA" && (
              <p className="insp3d-alert demo">
                A OS foi finalizada: novos apontamentos estão bloqueados.
              </p>
            )}
            <form onSubmit={registrar} className="insp3d-form">
              <label>
                Componente
                <select
                  required
                  value={form.regiao}
                  disabled={desabilitarCadastro}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, regiao: e.target.value }));
                    selecionarRegiao(e.target.value);
                  }}
                >
                  {Object.entries(regioes3D).map(([id, item]) => (
                    <option key={id} value={id}>
                      {item.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Gravidade
                <select
                  required
                  value={form.gravidade}
                  disabled={desabilitarCadastro}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, gravidade: e.target.value }))
                  }
                >
                  {Object.entries(GRAVIDADES).map(([id, nome]) => (
                    <option value={id} key={id}>
                      {nome}
                    </option>
                  ))}
                </select>
              </label>
              <label className="insp3d-field-wide">
                Título do diagnóstico
                <input
                  type="text"
                  placeholder="Ex.: Vazamento no sistema de arrefecimento"
                  required
                  maxLength={100}
                  value={form.titulo}
                  disabled={desabilitarCadastro}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, titulo: e.target.value }))
                  }
                />
              </label>
              <label className="insp3d-field-wide">
                Descrição técnica e orientação ao cliente
                <textarea
                  placeholder="Descreva o que foi encontrado, os sintomas e a recomendação da oficina."
                  required
                  maxLength={1500}
                  rows={4}
                  value={form.descricao}
                  disabled={desabilitarCadastro}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, descricao: e.target.value }))
                  }
                />
              </label>
              <button
                type="submit"
                disabled={desabilitarCadastro || enviando}
                className="insp3d-button primary"
              >
                {enviando
                  ? "Registrando..."
                  : "Registrar e disponibilizar ao cliente"}
              </button>
              {!ordemId && (
                <p className="insp3d-form-note">
                  Selecione uma ordem de serviço para habilitar o registro.
                </p>
              )}
            </form>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
