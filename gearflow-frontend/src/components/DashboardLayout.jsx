import { NavLink } from 'react-router-dom';

export default function DashboardLayout({ children, titulo, subtitulo }) {
    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>

            {/* Sidebar Lateral */}
            <aside className="sidebar">

                {/* Logo */}
                <div style={{ marginBottom: '48px', textAlign: 'center' }}>
                    <h2 style={{ color: '#FFFFFF', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--gf-accent)' }}>⚙️</span> Gearflow
                    </h2>
                </div>

                {/* Menu de Navegação */}
                <nav style={{ display: 'flex', flexDirection: 'column' }}>
                    <NavLink to="/dashboard" className="menu-link">
                        📊 Visão Geral
                    </NavLink>
                    <NavLink to="/equipe" className="menu-link">
                        👥 Gestão de Equipe
                    </NavLink>
                </nav>

                {/* Botão Sair */}
                <div style={{ marginTop: 'auto' }}>
                    <button className="btn-logout">
                        Sair do Sistema
                    </button>
                </div>
            </aside>

            {/* Área de Conteúdo Principal */}
            <main style={{ flex: 1, padding: '48px', display: 'flex', flexDirection: 'column' }}>

                {/* Header Dinâmico */}
                <header style={{ marginBottom: '40px' }}>
                    <h1 style={{ color: 'var(--gf-primary-dark)', fontSize: '2.2rem', fontWeight: '700' }}>
                        {titulo}
                    </h1>
                    {subtitulo && (
                        <p style={{ color: 'var(--gf-text-muted)', fontSize: '1.1rem', marginTop: '8px' }}>
                            {subtitulo}
                        </p>
                    )}
                </header>

                {/* Área onde os componentes filhos (o formulário) serão renderizados */}
                <div className="glass-card">
                    {children}
                </div>

            </main>
        </div>
    );
}