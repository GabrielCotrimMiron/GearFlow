
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../services/api";
import "./Servicos.css";

const FORMULARIO_VAZIO = {
  descricao: "",
  categoria: "",
  valorUni: "",
  tempoEstim: "",
};

function formatarMoeda(valor) {
  return Number(valor ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function CatalogoServicos() {
  const [servicos, setServicos] = useState([]);
  const [termoBusca, setTermoBusca] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [servicoEmEdicao, setServicoEmEdicao] = useState(null);
  const [servicoDetalhe, setServicoDetalhe] = useState(null);
  const [formData, setFormData] = useState(FORMULARIO_VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    let ativo = true;

    async function buscarServicos() {
      try {
        const response = await api.get("/servicos");
        const lista = Array.isArray(response.data)
          ? response.data
          : response.data?.content || [];

        if (ativo) setServicos(lista);
      } catch (error) {
        console.error(error);
        if (ativo) setErro("Não foi possível carregar os serviços.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    buscarServicos();

    return () => {
      ativo = false;
    };
  }, []);

  async function carregarServicos() {
    const response = await api.get("/servicos");
    const lista = Array.isArray(response.data)
      ? response.data
      : response.data?.content || [];

    setServicos(lista);
  }

  function handleChange(evento) {
    const { name, value } = evento.target;
    setFormData((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  function abrirModalNovo() {
    setServicoEmEdicao(null);
    setFormData({ ...FORMULARIO_VAZIO });
    setIsModalOpen(true);
    setErro("");
  }

  function abrirModalEdicao(servico) {
    setServicoEmEdicao(servico);
    setFormData({
      descricao: servico.descricao || "",
      categoria: servico.categoria || "",
      valorUni: servico.valorUni ?? "",
      tempoEstim: servico.tempoEstim ?? "",
    });
    setIsModalOpen(true);
    setErro("");
  }

  async function handleExcluir(id) {
    const confirmado = window.confirm(
      "Deseja realmente excluir este serviço do catálogo?",
    );

    if (!confirmado) return;

    setErro("");
    setMensagem("");

    try {
      await api.delete(`/servicos/${id}`);
      await carregarServicos();
      setServicoDetalhe(null);
      setMensagem("Serviço excluído com sucesso.");
    } catch (error) {
      console.error(error);
      setErro("Não foi possível excluir o serviço.");
    }
  }

  async function handleAplicarDesconto(servico) {
    const entrada = window.prompt(
      `Informe o desconto para "${servico.descricao}" (ex.: 10 para 10%):`,
    );

    if (entrada === null || entrada.trim() === "") return;

    const porcentagem = Number(entrada.replace(",", "."));

    if (
      !Number.isFinite(porcentagem) ||
      porcentagem <= 0 ||
      porcentagem > 100
    ) {
      setErro("Informe um desconto maior que 0 e de até 100%.");
      return;
    }

    setErro("");
    setMensagem("");

    try {
      const response = await api.patch(
        `/servicos/${servico.id}/desconto`,
        null,
        { params: { porcentagem } },
      );

      setServicoDetalhe(response.data);
      await carregarServicos();
      setMensagem("Desconto aplicado com sucesso.");
    } catch (error) {
      console.error(error);
      setErro("Não foi possível aplicar o desconto.");
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
      categoria: formData.categoria.trim(),
      valorUni: Number(formData.valorUni),
      tempoEstim: Number.parseInt(formData.tempoEstim, 10),
      qtd: 1,
    };

    try {
      if (servicoEmEdicao) {
        await api.put(`/servicos/${servicoEmEdicao.id}`, payload);
      } else {
        await api.post("/servicos", payload);
      }

      await carregarServicos();
      setIsModalOpen(false);
      setServicoEmEdicao(null);
      setMensagem(
        servicoEmEdicao
          ? "Serviço atualizado com sucesso."
          : "Serviço cadastrado com sucesso.",
      );
    } catch (error) {
      console.error(error);
      setErro("Não foi possível salvar o serviço. Verifique os dados.");
    } finally {
      setSalvando(false);
    }
  }

  const busca = termoBusca.trim().toLowerCase();

  const servicosFiltrados = servicos.filter((servico) => {
    const descricao = String(servico.descricao || "").toLowerCase();
    const categoria = String(servico.categoria || "").toLowerCase();

    return descricao.includes(busca) || categoria.includes(busca);
  });

  return (
    <div className="catalogo-pagina">
      <header className="catalogo-header">
        <div>
          <div className="catalogo-heading">
            <span className="catalogo-heading-icon">⚙</span>
            <h2>Gerenciamento de Serviços</h2>
          </div>
          <p>
            Consulte, cadastre e organize os serviços oferecidos pela oficina.
          </p>
        </div>

        <span className="catalogo-total">
          {servicos.length}{" "}
          {servicos.length === 1 ? "serviço cadastrado" : "serviços cadastrados"}
        </span>
      </header>

      {erro && (
        <div className="catalogo-alerta catalogo-alerta-erro" role="alert">
          {erro}
        </div>
      )}

      {mensagem && (
        <div className="catalogo-alerta catalogo-alerta-sucesso" role="status">
          {mensagem}
        </div>
      )}

      <div className="catalogo-toolbar">
        <div className="catalogo-busca">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            aria-label="Pesquisar serviços"
            placeholder="Pesquisar por serviço ou categoria..."
            value={termoBusca}
            onChange={(evento) => setTermoBusca(evento.target.value)}
          />
        </div>

        <button
          type="button"
          className="catalogo-btn catalogo-btn-primary"
          onClick={abrirModalNovo}
        >
          <span aria-hidden="true">＋</span>
          Adicionar serviço
        </button>
      </div>

      {carregando ? (
        <div className="catalogo-vazio">
          <h3>Carregando serviços...</h3>
          <p>Aguarde enquanto consultamos o catálogo.</p>
        </div>
      ) : servicosFiltrados.length === 0 ? (
        <div className="catalogo-vazio">
          <span aria-hidden="true">⚙</span>
          <h3>Nenhum serviço encontrado</h3>
          <p>
            {termoBusca
              ? "Experimente pesquisar por outro nome ou categoria."
              : erro
                ? "Verifique a conexão e tente novamente."
                : "Cadastre o primeiro serviço para começar."}
          </p>
        </div>
      ) : (
        <div className="catalogo-grid">
          {servicosFiltrados.map((servico, index) => (
            <article
              key={servico.id ?? `${servico.descricao}-${index}`}
              className="catalogo-card"
            >
              <div className="catalogo-card-topo">
                <div className="catalogo-servico-icone" aria-hidden="true">
                  ⚙
                </div>
                <span className="catalogo-categoria">
                  {servico.categoria || "Geral"}
                </span>
              </div>

              <h3>{servico.descricao || "Serviço sem descrição"}</h3>
              <p className="catalogo-card-descricao">
                Serviço de mão de obra cadastrado na oficina.
              </p>

              <div className="catalogo-dados">
                <div>
                  <span>Valor da mão de obra</span>
                  <strong>{formatarMoeda(servico.valorUni)}</strong>
                </div>

                <div>
                  <span>Tempo estimado</span>
                  <strong>{servico.tempoEstim ?? 0} min</strong>
                </div>
              </div>

              <div className="catalogo-acoes">
                <button
                  type="button"
                  className="catalogo-btn catalogo-btn-outline"
                  onClick={() => setServicoDetalhe(servico)}
                >
                  Detalhes
                </button>

                <button
                  type="button"
                  className="catalogo-btn catalogo-btn-outline"
                  onClick={() => abrirModalEdicao(servico)}
                >
                  Editar
                </button>

                <button
                  type="button"
                  className="catalogo-btn catalogo-btn-danger"
                  onClick={() => handleExcluir(servico.id)}
                >
                  Excluir
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {servicoDetalhe &&
        createPortal(
          <div
            className="modal-overlay catalogo-modal-overlay"
            onMouseDown={(evento) => {
              if (evento.target === evento.currentTarget) {
                setServicoDetalhe(null);
              }
            }}
          >
            <div
              className="modal-content catalogo-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="catalogo-detalhes-titulo"
            >
              <div className="catalogo-modal-header">
                <div>
                  <span className="catalogo-modal-etiqueta">
                    INFORMAÇÕES DO SERVIÇO
                  </span>
                  <h2 id="catalogo-detalhes-titulo">
                    Detalhes do serviço
                  </h2>
                </div>

                <button
                  type="button"
                  className="catalogo-fechar"
                  aria-label="Fechar detalhes"
                  onClick={() => setServicoDetalhe(null)}
                >
                  ×
                </button>
              </div>

              <div className="catalogo-detalhes">
                <div>
                  <span>Identificação</span>
                  <strong>Serviço #{servicoDetalhe.id}</strong>
                </div>
                <div>
                  <span>Descrição</span>
                  <strong>{servicoDetalhe.descricao}</strong>
                </div>
                <div>
                  <span>Categoria</span>
                  <strong>{servicoDetalhe.categoria || "Geral"}</strong>
                </div>
                <div>
                  <span>Preço fixo</span>
                  <strong>{formatarMoeda(servicoDetalhe.valorUni)}</strong>
                </div>
                <div>
                  <span>Tempo estimado</span>
                  <strong>{servicoDetalhe.tempoEstim ?? 0} minutos</strong>
                </div>
              </div>

              <div className="catalogo-modal-acoes">
                <button
                  type="button"
                  className="catalogo-btn catalogo-btn-outline"
                  onClick={() => handleAplicarDesconto(servicoDetalhe)}
                >
                  % Aplicar desconto
                </button>

                <button
                  type="button"
                  className="catalogo-btn catalogo-btn-primary"
                  onClick={() => {
                    const servico = servicoDetalhe;
                    setServicoDetalhe(null);
                    abrirModalEdicao(servico);
                  }}
                >
                  Editar serviço
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {isModalOpen &&
        createPortal(
          <div
            className="modal-overlay catalogo-modal-overlay"
            onMouseDown={(evento) => {
              if (evento.target === evento.currentTarget && !salvando) {
                setIsModalOpen(false);
              }
            }}
          >
            <div
              className="modal-content catalogo-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="catalogo-form-titulo"
            >
              <div className="catalogo-modal-header">
                <div>
                  <span className="catalogo-modal-etiqueta">
                    CATÁLOGO GEARFLOW
                  </span>
                  <h2 id="catalogo-form-titulo">
                    {servicoEmEdicao ? "Editar serviço" : "Novo serviço"}
                  </h2>
                </div>

                <button
                  type="button"
                  className="catalogo-fechar"
                  aria-label="Fechar formulário"
                  disabled={salvando}
                  onClick={() => setIsModalOpen(false)}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="catalogo-form-group">
                  <label htmlFor="servico-descricao">
                    Descrição do serviço
                  </label>
                  <input
                    id="servico-descricao"
                    name="descricao"
                    type="text"
                    className="catalogo-input"
                    placeholder="Ex.: Troca de óleo e filtro"
                    value={formData.descricao}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="catalogo-form-group">
                  <label htmlFor="servico-categoria">Categoria</label>
                  <input
                    id="servico-categoria"
                    name="categoria"
                    type="text"
                    className="catalogo-input"
                    placeholder="Ex.: Manutenção preventiva"
                    value={formData.categoria}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="catalogo-form-grid">
                  <div className="catalogo-form-group">
                    <label htmlFor="servico-valor">Preço fixo (R$)</label>
                    <input
                      id="servico-valor"
                      name="valorUni"
                      type="number"
                      min="0"
                      step="0.01"
                      className="catalogo-input"
                      placeholder="100.00"
                      value={formData.valorUni}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="catalogo-form-group">
                    <label htmlFor="servico-tempo">
                      Tempo estimado (min)
                    </label>
                    <input
                      id="servico-tempo"
                      name="tempoEstim"
                      type="number"
                      min="1"
                      step="1"
                      className="catalogo-input"
                      placeholder="60"
                      value={formData.tempoEstim}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="catalogo-modal-acoes">
                  <button
                    type="button"
                    className="catalogo-btn catalogo-btn-outline"
                    disabled={salvando}
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="catalogo-btn catalogo-btn-primary"
                    disabled={salvando}
                  >
                    {salvando
                      ? "Salvando..."
                      : servicoEmEdicao
                        ? "Salvar alterações"
                        : "Cadastrar serviço"}
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
