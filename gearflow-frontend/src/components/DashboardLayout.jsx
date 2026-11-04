
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { limparCredenciais } from "../services/clienteAuth";
import "./DashboardLayout.css";

const icones = {
  painel: "▦",
  carro: "🚗",
  ordem: "🛠",
  usuario: "◉",
  equipe: "♙",
  pecas: "⚙",
  servicos: "☷",
  prioridade: "⚑",
};

export default function DashboardLayout({
  children,
  titulo,
  subtitulo,
  tipoUsuario = "FUNCIONARIO",
}) {
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);

  const cliente = tipoUsuario === "CLIENTE";

  const links = cliente
    ? [
        { rota: "/DashboardCliente", texto: "Visão Geral", icone: "painel" },
        { rota: "/meus-veiculos", texto: "Meus Veículos", icone: "carro" },
        { rota: "/minhas-os", texto: "Ordens de Serviço", icone: "ordem" },
        { rota: "/meu-perfil", texto: "Meu Perfil", icone: "usuario" },
      ]
    : [
        { rota: "/dashboard", texto: "Visão Geral", icone: "painel" },
        { rota: "/equipe", texto: "Gestão de Equipe", icone: "equipe" },
        { rota: "/pecas", texto: "Gestão de Peças", icone: "pecas" },
        { rota: "/servicos", texto: "Catálogo de Serviços", icone: "servicos" },
        {
          rota: "/fila-prioridade",
          texto: "Fila de Prioridades",
          icone: "prioridade",
        },
      ];

  function handleLogout() {
    limparCredenciais();
    navigate("/", { replace: true });
  }

  return (
    <div className="gf-layout">
      {menuAberto && (
        <button
          type="button"
          className="gf-sidebar-overlay"
          aria-label="Fechar menu"
          onClick={() => setMenuAberto(false)}
        />
      )}

      <aside className={`sidebar gf-sidebar ${menuAberto ? "gf-sidebar-open" : ""}`}>
        <div className="gf-brand">
          <div className="gf-brand-icon">⚙</div>

          <div>
            <h2>GearFlow</h2>
            <p>Gestão inteligente</p>
          </div>
        </div>

        <div className="gf-workspace">
          <div className="gf-workspace-avatar">
            {cliente ? "C" : "F"}
          </div>

          <div>
            <span className="gf-workspace-label">ÁREA DE ACESSO</span>
            <strong>{cliente ? "Portal do Cliente" : "Painel da Oficina"}</strong>
          </div>
        </div>

        <nav className="gf-navigation" aria-label="Menu principal">
          <p className="gf-nav-caption">MENU PRINCIPAL</p>

          {links.map((link) => (
            <NavLink
              key={link.rota}
              to={link.rota}
              className={({ isActive }) =>
                `menu-link gf-nav-link ${isActive ? "active" : ""}`
              }
              onClick={() => setMenuAberto(false)}
            >
              <span className="gf-nav-icon" aria-hidden="true">
                {icones[link.icone]}
              </span>
              <span>{link.texto}</span>
            </NavLink>
          ))}
        </nav>

        <div className="gf-sidebar-footer">
          <div className="gf-sidebar-help">
            <span className="gf-help-indicator" />
            <div>
              <strong>Sistema operacional</strong>
              <p>GearFlow • Oficina</p>
            </div>
          </div>

          <button
            type="button"
            className="btn-logout gf-logout"
            onClick={handleLogout}
          >
            <span aria-hidden="true">↪</span>
            Sair do Sistema
          </button>
        </div>
      </aside>

      <div className="gf-main-area">
        <div className="gf-topbar">
          <button
            type="button"
            className="gf-menu-toggle"
            aria-label="Abrir menu"
            aria-expanded={menuAberto}
            onClick={() => setMenuAberto(!menuAberto)}
          >
            ☰
          </button>

          <div className="gf-topbar-location">
            <span>GearFlow</span>
            <span className="gf-breadcrumb-separator">/</span>
            <strong>{titulo || "Painel"}</strong>
          </div>

          <div className="gf-topbar-right">
            <span className="gf-online-dot" />
            <span>Ambiente de gestão</span>
          </div>
        </div>

        <main className="gf-content">
          <header className="gf-page-header">
            <div>
              <p className="gf-page-eyebrow">
                {cliente ? "ESPAÇO DO CLIENTE" : "CENTRAL DE GESTÃO"}
              </p>

              <h1>{titulo || "Painel GearFlow"}</h1>

              {subtitulo && <p className="gf-page-subtitle">{subtitulo}</p>}
            </div>

            <div className="gf-page-header-decoration" aria-hidden="true">
              <span>⚙</span>
            </div>
          </header>

          <section className="glass-card gf-content-card">
            {children}
          </section>

          <footer className="gf-main-footer">
            <span>© {new Date().getFullYear()} GearFlow</span>
            <span>Sistema de Gerenciamento de Oficina Mecânica</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
