import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { gerarAutorizacaoBasica } from "../services/clienteAuth";
import "./AlertasPreventivos.css";

const numero = (n) => new Intl.NumberFormat("pt-BR").format(n ?? 0);
const rotulos = {
  VENCIDA: "Vencida",
  ATINGIDA: "Atingida",
  PROXIMA: "Próxima",
  EM_DIA: "Em dia",
  SEM_QUILOMETRAGEM: "KM não informada",
};

export default function AlertasPreventivos() {
  const [alertas, setAlertas] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    veiculoId: "",
    descricao: "",
    kmPrevista: "",
    antecedenciaKm: "1000",
  });
  const headers = () => ({ Authorization: gerarAutorizacaoBasica() });

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const [a, v] = await Promise.all([
        api.get("/alertas-preventivos/meus", { headers: headers() }),
        api.get("/veiculos/meus", { headers: headers() }),
      ]);
      setAlertas(Array.isArray(a.data) ? a.data : []);
      setVeiculos(Array.isArray(v.data) ? v.data : []);
    } catch (e) {
      setErro(
        `Não foi possível carregar as manutenções (${e.response?.status || e.message}).`,
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      void carregar();
    }, 0);
    return () => clearTimeout(id);
  }, [carregar]);

  async function cadastrar(e) {
    e.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      await api.post(
        "/alertas-preventivos",
        {
          veiculoId: Number(form.veiculoId),
          descricao: form.descricao.trim(),
          kmPrevista: Number(form.kmPrevista),
          antecedenciaKm: Number(form.antecedenciaKm),
        },
        { headers: headers() },
      );
      setForm({
        veiculoId: "",
        descricao: "",
        kmPrevista: "",
        antecedenciaKm: "1000",
      });
      await carregar();
    } catch (e2) {
      setErro(
        `Não foi possível cadastrar (${e2.response?.status || e2.message}).`,
      );
    } finally {
      setSalvando(false);
    }
  }

  async function concluir(id) {
    if (!window.confirm("Arquivar esta programação preventiva?")) return;
    try {
      await api.delete(`/alertas-preventivos/${id}`, { headers: headers() });
      await carregar();
    } catch (e) {
      setErro(
        `Não foi possível arquivar (${e.response?.status || e.message}).`,
      );
    }
  }

  const relevantes = alertas.filter((a) =>
    ["PROXIMA", "ATINGIDA", "VENCIDA"].includes(a.situacao),
  ).length;
  return (
    <section className="rf21" aria-label="Manutenções preventivas">
      <div className="rf21-head">
        <div>
          <span className="rf21-eyebrow">CUIDADO COM SEU VEÍCULO</span>
          <h3>Alertas preventivos</h3>
          <p>Manutenções programadas por quilometragem.</p>
        </div>
        <div className="rf21-actions">
          <span className="rf21-counter">{relevantes} alerta(s)</span>
          <button type="button" onClick={carregar} disabled={carregando}>
            ↻ Atualizar
          </button>
        </div>
      </div>
      {erro && (
        <p className="rf21-error" role="alert">
          {erro}
        </p>
      )}
      {carregando ? (
        <p className="rf21-empty">Carregando manutenções...</p>
      ) : alertas.length === 0 ? (
        <p className="rf21-empty">
          Nenhuma manutenção programada. Cadastre uma abaixo.
        </p>
      ) : (
        <div className="rf21-list">
          {alertas.map((a) => (
            <article
              key={a.id}
              className={`rf21-item rf21-${a.situacao.toLowerCase()}`}
            >
              <div className="rf21-item-main">
                <strong>{a.descricao}</strong>
                <span>
                  {a.veiculo || "Veículo"} · {a.placa}
                </span>
                <small>
                  Atual:{" "}
                  {a.kmAtual == null
                    ? "não informada"
                    : `${numero(a.kmAtual)} km`}{" "}
                  · Prevista: {numero(a.kmPrevista)} km
                </small>
              </div>
              <div className="rf21-item-side">
                <span className="rf21-status">
                  {rotulos[a.situacao] || a.situacao}
                </span>
                <small>
                  {a.kmRestantes == null
                    ? "Atualize a KM do veículo"
                    : a.kmRestantes < 0
                      ? `${numero(-a.kmRestantes)} km de atraso`
                      : `${numero(a.kmRestantes)} km restantes`}
                </small>
                <button type="button" onClick={() => concluir(a.id)}>
                  Arquivar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <form className="rf21-form" onSubmit={cadastrar}>
        <h4>Programar manutenção</h4>
        <div className="rf21-fields">
          <label>
            Veículo
            <select
              required
              value={form.veiculoId}
              onChange={(e) =>
                setForm((p) => ({ ...p, veiculoId: e.target.value }))
              }
            >
              <option value="">Selecione</option>
              {veiculos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.marca} {v.modelo} · {v.placa}
                </option>
              ))}
            </select>
          </label>
          <label>
            Manutenção
            <input
              required
              maxLength={120}
              placeholder="Ex.: Troca de óleo"
              value={form.descricao}
              onChange={(e) =>
                setForm((p) => ({ ...p, descricao: e.target.value }))
              }
            />
          </label>
          <label>
            Próxima revisão (km)
            <input
              type="number"
              min="0"
              required
              value={form.kmPrevista}
              onChange={(e) =>
                setForm((p) => ({ ...p, kmPrevista: e.target.value }))
              }
            />
          </label>
          <label>
            Avisar antes (km)
            <input
              type="number"
              min="0"
              max="100000"
              required
              value={form.antecedenciaKm}
              onChange={(e) =>
                setForm((p) => ({ ...p, antecedenciaKm: e.target.value }))
              }
            />
          </label>
        </div>
        <button type="submit" disabled={salvando || veiculos.length === 0}>
          {salvando ? "Salvando..." : "+ Programar manutenção"}
        </button>
        {veiculos.length === 0 && !carregando && (
          <small>
            Cadastre um veículo na área Meus Veículos antes de programar.
          </small>
        )}
      </form>
    </section>
  );
}
