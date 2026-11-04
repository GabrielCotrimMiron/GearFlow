
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../services/api";
import "./GestaoPecas.css";

const FORMULARIO_VAZIO = {
  descricao: "",
  codFabri: "",
  valorUni: "",
  qtdEstoque: "",
};

function formatarMoeda(valor) {
  return Number(valor ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function estoqueBaixo(peca) {
  return peca.estoqueBaixo ?? Number(peca.qtdEstoque ?? 0) <= 5;
}

export default function GestaoPecas() {
  const [pecas, setPecas] = useState([]);
  const [termoBusca, setTermoBusca] = useState("");
  const [filtro, setFiltro] = useState("TODAS");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pecaEmEdicao, setPecaEmEdicao] = useState(null);
  const [pecaDetalhe, setPecaDetalhe] = useState(null);
  const [formData, setFormData] = useState(FORMULARIO_VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    let ativo = true;

    async function buscarPecas() {
      try {
        const resposta = await api.get("/pecas");
        const lista = Array.isArray(resposta.data)
          ? resposta.data
          : resposta.data?.content || [];

        if (ativo) setPecas(lista);
      } catch (error) {
        console.error(error);
        if (ativo) setErro("Não foi possível carregar as peças.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    buscarPecas();

    return () => {
      ativo = false;
    };
  }, []);

  async function carregarPecas() {
    const resposta = await api.get("/pecas");
    const lista = Array.isArray(resposta.data)
      ? resposta.data
      : resposta.data?.content || [];

    setPecas(lista);
  }

  function handleChange(evento) {
    const { name, value } = evento.target;
    setFormData((anterior) => ({ ...anterior, [name]: value }));
  }

  function abrirModalNovo() {
    setPecaEmEdicao(null);
    setFormData({ ...FORMULARIO_VAZIO });
    setIsModalOpen(true);
    setErro("");
  }

  function abrirModalEdicao(peca) {
    setPecaEmEdicao(peca);
    setFormData({
      descricao: peca.descricao || "",
      codFabri: peca.codFabri || "",
      valorUni: peca.valorUni ?? "",
      qtdEstoque: peca.qtdEstoque ?? "",
    });
    setIsModalOpen(true);
    setErro("");
  }

  async function handleExcluir(id) {
    const confirmado = window.confirm(
      "Deseja realmente excluir esta peça do estoque?",
    );

    if (!confirmado) return;

    setErro("");
    setMensagem("");

    try {
      await api.delete(`/pecas/${id}`);
      await carregarPecas();
      setPecaDetalhe(null);
      setMensagem("Peça excluída com sucesso.");
    } catch (error) {
      console.error(error);
      setErro("Não foi possível excluir a peça.");
    }
  }

  async function handleSubmit(evento) {
    evento.preventDefault();
    if (salvando) return;

    setSalvando(true);
    setErro("");
    setMensagem("");

    const payload = {
      descricao: formData.descricao.trim(),
      codFabri: formData.codFabri.trim(),
      valorUni: Number(formData.valorUni),
      qtdEstoque: Number.parseInt(formData.qtdEstoque, 10),
      qtd: 0,
    };

    try {
      if (pecaEmEdicao) {
        await api.put(`/pecas/${pecaEmEdicao.id}`, payload);
      } else {
        await api.post("/pecas", payload);
      }

      await carregarPecas();
      setIsModalOpen(false);
      setPecaEmEdicao(null);
      setMensagem(
        pecaEmEdicao
          ? "Peça atualizada com sucesso."
          : "Peça cadastrada com sucesso.",
      );
    } catch (error) {
      console.error(error);
      setErro("Não foi possível salvar a peça. Verifique os dados.");
    } finally {
      setSalvando(false);
    }
  }

  const busca = termoBusca.trim().toLowerCase();

  const pecasFiltradas = pecas.filter((peca) => {
    const descricao = String(peca.descricao || "").toLowerCase();
    const codigo = String(peca.codFabri || "").toLowerCase();

    const correspondeBusca =
      descricao.includes(busca) || codigo.includes(busca);

    const correspondeFiltro =
      filtro === "TODAS" ||
      (filtro === "BAIXO" && estoqueBaixo(peca)) ||
      (filtro === "NORMAL" && !estoqueBaixo(peca));

    return correspondeBusca && correspondeFiltro;
  });

  const totalBaixo = pecas.filter(estoqueBaixo).length;

  const valorTotal = pecas.reduce(
    (total, peca) =>
      total +
      Number(peca.valorUni ?? 0) * Number(peca.qtdEstoque ?? 0),
    0,
  );

  return (
    <div className="pecas-pagina">
      <header className="pecas-header">
        <div>
          <div className="pecas-heading">
            <span className="pecas-heading-icon">⚙</span>
            <h2>Controle de Estoque</h2>
          </div>
          <p>Gerencie as peças e acompanhe a disponibilidade do estoque.</p>
        </div>
        <span className="pecas-total">Inventário de peças</span>
      </header>

      {erro && (
        <div className="pecas-alerta pecas-alerta-erro" role="alert">
          {erro}
        </div>
      )}

      {mensagem && (
        <div className="pecas-alerta pecas-alerta-sucesso" role="status">
          {mensagem}
        </div>
      )}

      <div className="pecas-indicadores">
        <div className="pecas-indicador">
          <span className="pecas-indicador-icone pecas-icone-total">▦</span>
          <div>
            <strong>{pecas.length}</strong>
            <span>Peças cadastradas</span>
          </div>
        </div>

        <div className="pecas-indicador">
          <span className="pecas-indicador-icone pecas-icone-alerta">!</span>
          <div>
            <strong>{totalBaixo}</strong>
            <span>Estoque baixo</span>
          </div>
        </div>

        <div className="pecas-indicador">
          <span className="pecas-indicador-icone pecas-icone-valor">R$</span>
          <div>
            <strong className="pecas-valor-total">
              {formatarMoeda(valorTotal)}
            </strong>
            <span>Valor total em estoque</span>
          </div>
        </div>
      </div>

      <div className="pecas-toolbar">
        <div className="pecas-busca">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            aria-label="Pesquisar peças"
            placeholder="Pesquisar por peça ou código..."
            value={termoBusca}
            onChange={(evento) => setTermoBusca(evento.target.value)}
          />
        </div>

        <select
          className="pecas-filtro"
          aria-label="Filtrar por estoque"
          value={filtro}
          onChange={(evento) => setFiltro(evento.target.value)}
        >
          <option value="TODAS">Todas as peças</option>
          <option value="BAIXO">Estoque baixo</option>
          <option value="NORMAL">Estoque normal</option>
        </select>

        <button
          type="button"
          className="pecas-btn pecas-btn-primary"
          onClick={abrirModalNovo}
        >
          ＋ Adicionar peça
        </button>
      </div>

      {carregando ? (
        <div className="pecas-vazio">
          <h3>Carregando estoque...</h3>
          <p>Aguarde enquanto consultamos as peças cadastradas.</p>
        </div>
      ) : pecasFiltradas.length === 0 ? (
        <div className="pecas-vazio">
          <span aria-hidden="true">▦</span>
          <h3>Nenhuma peça encontrada</h3>
          <p>
            {busca || filtro !== "TODAS"
              ? "Tente alterar os filtros ou a pesquisa."
              : "Ainda não há peças cadastradas no estoque."}
          </p>
        </div>
      ) : (
        <div className="pecas-grid">
          {pecasFiltradas.map((peca, index) => {
            const baixo = estoqueBaixo(peca);

            return (
              <article
                key={peca.id ?? `${peca.codFabri}-${index}`}
                className="pecas-card"
              >
                <div className="pecas-card-topo">
                  <span className="pecas-card-icone">⚙</span>
                  <span
                    className={`pecas-status ${
                      baixo ? "pecas-status-baixo" : "pecas-status-normal"
                    }`}
                  >
                    {baixo ? "Estoque baixo" : "Em estoque"}
                  </span>
                </div>

                <h3>{peca.descricao || "Peça sem descrição"}</h3>
                <p className="pecas-codigo">
                  Código: {peca.codFabri || "Não informado"}
                </p>

                <div className="pecas-dados">
                  <div>
                    <span>Preço unitário</span>
                    <strong>{formatarMoeda(peca.valorUni)}</strong>
                  </div>
                  <div>
                    <span>Quantidade</span>
                    <strong>{peca.qtdEstoque ?? 0} un.</strong>
                  </div>
                </div>

                <div className="pecas-acoes">
                  <button
                    type="button"
                    className="pecas-btn pecas-btn-outline"
                    onClick={() => setPecaDetalhe(peca)}
                  >
                    Detalhes
                  </button>
                  <button
                    type="button"
                    className="pecas-btn pecas-btn-outline"
                    onClick={() => abrirModalEdicao(peca)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="pecas-btn pecas-btn-danger"
                    onClick={() => handleExcluir(peca.id)}
                  >
                    Excluir
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {pecaDetalhe &&
        createPortal(
          <div
            className="modal-overlay pecas-modal-overlay"
            onMouseDown={(evento) => {
              if (evento.target === evento.currentTarget) {
                setPecaDetalhe(null);
              }
            }}
          >
            <div
              className="modal-content pecas-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="pecas-detalhes-titulo"
            >
              <div className="pecas-modal-header">
                <div>
                  <span className="pecas-modal-etiqueta">
                    INFORMAÇÕES DO ESTOQUE
                  </span>
                  <h2 id="pecas-detalhes-titulo">Detalhes da peça</h2>
                </div>
                <button
                  type="button"
                  className="pecas-fechar"
                  aria-label="Fechar detalhes"
                  onClick={() => setPecaDetalhe(null)}
                >
                  ×
                </button>
              </div>

              <div className="pecas-detalhes">
                <div>
                  <span>Identificação</span>
                  <strong>Peça #{pecaDetalhe.id}</strong>
                </div>
                <div>
                  <span>Descrição</span>
                  <strong>{pecaDetalhe.descricao}</strong>
                </div>
                <div>
                  <span>Código do fabricante</span>
                  <strong>{pecaDetalhe.codFabri}</strong>
                </div>
                <div>
                  <span>Preço unitário</span>
                  <strong>{formatarMoeda(pecaDetalhe.valorUni)}</strong>
                </div>
                <div>
                  <span>Quantidade em estoque</span>
                  <strong>{pecaDetalhe.qtdEstoque ?? 0} unidades</strong>
                </div>
                <div>
                  <span>Valor total desta peça</span>
                  <strong>
                    {formatarMoeda(
                      Number(pecaDetalhe.valorUni ?? 0) *
                        Number(pecaDetalhe.qtdEstoque ?? 0),
                    )}
                  </strong>
                </div>
                <div>
                  <span>Situação</span>
                  <strong>
                    {estoqueBaixo(pecaDetalhe)
                      ? "Estoque baixo — reabastecer"
                      : "Estoque normal"}
                  </strong>
                </div>
              </div>

              <div className="pecas-modal-acoes">
                <button
                  type="button"
                  className="pecas-btn pecas-btn-outline"
                  onClick={() => setPecaDetalhe(null)}
                >
                  Fechar
                </button>
                <button
                  type="button"
                  className="pecas-btn pecas-btn-primary"
                  onClick={() => {
                    const peca = pecaDetalhe;
                    setPecaDetalhe(null);
                    abrirModalEdicao(peca);
                  }}
                >
                  Editar peça
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {isModalOpen &&
        createPortal(
          <div
            className="modal-overlay pecas-modal-overlay"
            onMouseDown={(evento) => {
              if (evento.target === evento.currentTarget && !salvando) {
                setIsModalOpen(false);
              }
            }}
          >
            <div
              className="modal-content pecas-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="pecas-form-titulo"
            >
              <div className="pecas-modal-header">
                <div>
                  <span className="pecas-modal-etiqueta">
                    INVENTÁRIO GEARFLOW
                  </span>
                  <h2 id="pecas-form-titulo">
                    {pecaEmEdicao ? "Editar peça" : "Nova peça"}
                  </h2>
                </div>
                <button
                  type="button"
                  className="pecas-fechar"
                  aria-label="Fechar formulário"
                  disabled={salvando}
                  onClick={() => setIsModalOpen(false)}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="pecas-form-group">
                  <label htmlFor="peca-descricao">Descrição da peça</label>
                  <input
                    id="peca-descricao"
                    type="text"
                    name="descricao"
                    className="pecas-input"
                    placeholder="Ex.: Pastilha de freio dianteira"
                    value={formData.descricao}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="pecas-form-group">
                  <label htmlFor="peca-codigo">Código do fabricante</label>
                  <input
                    id="peca-codigo"
                    type="text"
                    name="codFabri"
                    className="pecas-input"
                    placeholder="Ex.: COB-1234"
                    value={formData.codFabri}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="pecas-form-grid">
                  <div className="pecas-form-group">
                    <label htmlFor="peca-valor">Preço unitário (R$)</label>
                    <input
                      id="peca-valor"
                      type="number"
                      name="valorUni"
                      min="0"
                      step="0.01"
                      className="pecas-input"
                      placeholder="89.90"
                      value={formData.valorUni}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="pecas-form-group">
                    <label htmlFor="peca-quantidade">
                      Quantidade em estoque
                    </label>
                    <input
                      id="peca-quantidade"
                      type="number"
                      name="qtdEstoque"
                      min="0"
                      step="1"
                      className="pecas-input"
                      placeholder="15"
                      value={formData.qtdEstoque}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="pecas-modal-acoes">
                  <button
                    type="button"
                    className="pecas-btn pecas-btn-outline"
                    disabled={salvando}
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="pecas-btn pecas-btn-primary"
                    disabled={salvando}
                  >
                    {salvando
                      ? "Salvando..."
                      : pecaEmEdicao
                        ? "Salvar alterações"
                        : "Cadastrar peça"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
