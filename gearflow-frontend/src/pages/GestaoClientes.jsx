import { useCallback, useEffect, useMemo, useState } from "react";
import { gerarAutorizacaoBasica } from "../services/clienteAuth";
import api from "../services/api";
import "./GestaoClientes.css";

const vazio = { nome: "", email: "", cpf: "", telefone: "", senha: "" };
const normalizar = (valor) => String(valor ?? "").toLowerCase();
const mensagemErro = (erro) => {
  if (erro.response?.status === 401)
    return "Sua sessão não está autenticada. Entre novamente no sistema.";
  if (erro.response?.status === 403)
    return "Apenas gerentes autorizados podem gerenciar clientes.";
  if (erro.response?.status === 409)
    return typeof erro.response.data === "string"
      ? erro.response.data
      : "Não foi possível concluir: cadastro duplicado ou cliente com vínculos existentes.";
  if (erro.response?.status === 400)
    return typeof erro.response.data === "string"
      ? erro.response.data
      : "Confira os dados preenchidos.";
  return "Não foi possível conectar ao servidor. Verifique o Spring Boot e tente novamente.";
};
const config = () => ({ headers: { Authorization: gerarAutorizacaoBasica() } });

export default function GestaoClientes() {
  const [clientes, setClientes] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [semPermissao, setSemPermissao] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(vazio);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resposta = await api.get("/admin/clientes", config());
      setClientes(Array.isArray(resposta.data) ? resposta.data : []);
      setSemPermissao(false);
    } catch (e) {
      setSemPermissao(e.response?.status === 401 || e.response?.status === 403);
      setErro(mensagemErro(e));
    } finally {
      setCarregando(false);
    }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregar();
  }, [carregar]);

  const filtrados = useMemo(
    () =>
      clientes.filter((c) =>
        [c.nome, c.email, c.cpf, c.telefone, String(c.id)].some((x) =>
          normalizar(x).includes(normalizar(pesquisa.trim())),
        ),
      ),
    [clientes, pesquisa],
  );

  function abrirNovo() {
    setModal({ tipo: "novo" });
    setForm(vazio);
    setErro("");
    setSucesso("");
  }
  function abrirEdicao(cliente) {
    setModal({ tipo: "editar", id: cliente.id });
    setForm({
      nome: cliente.nome || "",
      email: cliente.email || "",
      cpf: cliente.cpf || "",
      telefone: cliente.telefone || "",
      senha: "",
    });
    setErro("");
    setSucesso("");
  }
  async function salvar(evento) {
    evento.preventDefault();
    if (salvando) return;
    setErro("");
    setSucesso("");
    setSalvando(true);
    const dados = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v.trim()]),
    );
    if (modal.tipo === "editar" && !dados.senha) delete dados.senha;
    try {
      if (modal.tipo === "novo")
        await api.post("/admin/clientes", dados, config());
      else await api.put(`/admin/clientes/${modal.id}`, dados, config());
      setModal(null);
      setForm(vazio);
      setSucesso(
        modal.tipo === "novo"
          ? "Cliente cadastrado com sucesso."
          : "Dados do cliente atualizados.",
      );
      await carregar();
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setSalvando(false);
    }
  }
  async function excluir() {
    if (!excluindo || salvando) return;
    setSalvando(true);
    setErro("");
    setSucesso("");
    try {
      await api.delete(`/admin/clientes/${excluindo.id}`, config());
      setExcluindo(null);
      setSucesso("Cliente excluído com sucesso.");
      await carregar();
    } catch (e) {
      setErro(mensagemErro(e));
      setExcluindo(null);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="gclientes">
      <header className="gclientes-topo">
        <div>
          <span className="gclientes-kicker">GESTÃO ADMINISTRATIVA</span>
          <h2>Clientes cadastrados</h2>
          <p>Consulte e mantenha os dados de clientes da oficina.</p>
        </div>
        {!semPermissao && (
          <button
            className="gclientes-btn primary"
            type="button"
            onClick={abrirNovo}
          >
            ＋ Novo cliente
          </button>
        )}
      </header>
      {erro && (
        <div className="gclientes-feedback erro" role="alert">
          {erro}
        </div>
      )}
      {sucesso && (
        <div className="gclientes-feedback sucesso" role="status">
          {sucesso}
        </div>
      )}
      {!semPermissao && (
        <>
          <section className="gclientes-indicadores">
            <div>
              <small>CLIENTES CADASTRADOS</small>
              <strong>{carregando ? "—" : clientes.length}</strong>
              <span>Registros da oficina</span>
            </div>
            <div>
              <small>RESULTADOS DA PESQUISA</small>
              <strong>{carregando ? "—" : filtrados.length}</strong>
              <span>Clientes encontrados</span>
            </div>
          </section>
          <div className="gclientes-ferramentas">
            <label htmlFor="gclientes-busca">Buscar clientes</label>
            <input
              id="gclientes-busca"
              type="search"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder="Nome, e-mail, CPF, telefone ou ID"
            />
            <button
              type="button"
              onClick={carregar}
              disabled={carregando}
              className="gclientes-btn outline"
            >
              ↻ Atualizar
            </button>
          </div>
          <div className="gclientes-tabela-wrap">
            <table className="gclientes-tabela">
              <thead>
                <tr>
                  <th>CLIENTE</th>
                  <th>CPF</th>
                  <th>CONTATO</th>
                  <th>VEÍCULOS</th>
                  <th>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan={5} className="gclientes-vazio">
                      Carregando clientes...
                    </td>
                  </tr>
                ) : filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="gclientes-vazio">
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                ) : (
                  filtrados.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="gclientes-nome">
                          <span className="gclientes-avatar">
                            {(c.nome || "?").slice(0, 1).toUpperCase()}
                          </span>
                          <div>
                            <strong>{c.nome || "Sem nome"}</strong>
                            <small>ID #{c.id}</small>
                          </div>
                        </div>
                      </td>
                      <td>{c.cpf || "—"}</td>
                      <td>
                        <div className="gclientes-contato">
                          <strong>{c.email}</strong>
                          <small>{c.telefone || "—"}</small>
                        </div>
                      </td>
                      <td>{Number(c.quantidadeVeiculos || 0)}</td>
                      <td>
                        <div className="gclientes-acoes">
                          <button
                            type="button"
                            onClick={() => abrirEdicao(c)}
                            className="gclientes-btn outline small"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setExcluindo(c);
                              setErro("");
                            }}
                            className="gclientes-btn danger small"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="gclientes-nota">
            Somente gerentes autenticados têm permissão para visualizar e
            alterar esses cadastros. Clientes com veículos vinculados não podem
            ser excluídos.
          </p>
        </>
      )}
      {modal && (
        <div
          className="gclientes-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !salvando) setModal(null);
          }}
        >
          <section
            className="gclientes-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gclientes-modal-titulo"
          >
            <div className="gclientes-modal-head">
              <div>
                <span className="gclientes-kicker">CADASTRO DE CLIENTES</span>
                <h3 id="gclientes-modal-titulo">
                  {modal.tipo === "novo"
                    ? "Adicionar cliente"
                    : `Editar cliente #${modal.id}`}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Fechar"
                disabled={salvando}
                onClick={() => setModal(null)}
              >
                ×
              </button>
            </div>
            {erro && (
              <div className="gclientes-feedback erro" role="alert">
                {erro}
              </div>
            )}
            <form onSubmit={salvar}>
              <div className="gclientes-form-grid">
                {[
                  ["nome", "Nome completo", "text"],
                  ["email", "E-mail", "email"],
                  ["cpf", "CPF", "text"],
                  ["telefone", "Telefone", "tel"],
                  [
                    "senha",
                    modal.tipo === "novo"
                      ? "Senha inicial"
                      : "Nova senha (opcional)",
                    "password",
                  ],
                ].map(([nome, rotulo, tipo]) => (
                  <label key={nome}>
                    {rotulo}
                    <input
                      name={nome}
                      type={tipo}
                      maxLength={
                        nome === "cpf" ? 14 : nome === "telefone" ? 20 : 120
                      }
                      autoComplete="off"
                      required={modal.tipo === "novo" || nome !== "senha"}
                      value={form[nome]}
                      onChange={(e) =>
                        setForm((a) => ({ ...a, [nome]: e.target.value }))
                      }
                    />
                  </label>
                ))}
              </div>
              <p className="gclientes-ajuda">
                {modal.tipo === "novo"
                  ? "Defina uma senha inicial para o cliente."
                  : "Deixe a senha em branco para mantê-la. Alterar o e-mail também altera o login do cliente."}
              </p>
              <div className="gclientes-modal-botoes">
                <button
                  type="button"
                  className="gclientes-btn outline"
                  disabled={salvando}
                  onClick={() => setModal(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="gclientes-btn primary"
                >
                  {salvando ? "Salvando..." : "Salvar cliente"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {excluindo && (
        <div className="gclientes-overlay">
          <section
            className="gclientes-modal pequena"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="gclientes-excluir-titulo"
          >
            <h3 id="gclientes-excluir-titulo">Excluir cliente?</h3>
            <p>
              Você deseja excluir <strong>{excluindo.nome}</strong>? Esta ação é
              permanente. Se houver veículos associados, o servidor impedirá a
              exclusão.
            </p>
            <div className="gclientes-modal-botoes">
              <button
                type="button"
                disabled={salvando}
                className="gclientes-btn outline"
                onClick={() => setExcluindo(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={salvando}
                className="gclientes-btn danger-filled"
                onClick={excluir}
              >
                {salvando ? "Excluindo..." : "Confirmar exclusão"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
