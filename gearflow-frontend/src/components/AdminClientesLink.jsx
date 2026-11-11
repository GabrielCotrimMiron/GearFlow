import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import api from "../services/api";
import { gerarAutorizacaoBasica } from "../services/clienteAuth";

/** Oculta a opção para quem não é gerente; a autorização real ocorre no backend. */
export default function AdminClientesLink({ aoNavegar }) {
  const [autorizado, setAutorizado] = useState(false);
  useEffect(() => {
    let ativo = true;
    async function consultar() {
      try {
        const r = await api.get("/admin/clientes/acesso", {
          headers: { Authorization: gerarAutorizacaoBasica() },
        });
        if (ativo) setAutorizado(r.data?.autorizado === true);
      } catch {
        if (ativo) setAutorizado(false);
      }
    }
    void consultar();
    return () => {
      ativo = false;
    };
  }, []);
  if (!autorizado) return null;
  return (
    <NavLink
      to="/clientes-admin"
      className={({ isActive }) =>
        `menu-link gf-nav-link ${isActive ? "active" : ""}`
      }
      onClick={aoNavegar}
    >
      <span className="gf-nav-icon" aria-hidden="true">
        ♙
      </span>
      <span>Gestão de Clientes</span>
    </NavLink>
  );
}
