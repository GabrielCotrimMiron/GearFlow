import { NavLink } from 'react-router-dom';

export default function DashboardLayout({ children, titulo, subtitulo, tipoUsuario = 'FUNCIONARIO' }) {
    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <aside className="sidebar">
                <div style={{ marginBottom: '48px', textAlign: 'center' }}>
                    <h2 style={{ color: '#FFFFFF', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--gf-accent)' }}>⚙️</span> Gearflow
                    </h2>


                    {tipoUsuario === 'CLIENTE' ? (
                        <p style={{ color: '#A0AEC0', fontSize: '0.9rem', marginTop: '4px' }}>Área do Cliente</p>
                    ) : ( <p style={{ color: '#A0AEC0', fontSize: '0.9rem', marginTop: '4px' }}>Área do Funcionário</p>

                    )}
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column' }}>
                    {tipoUsuario === 'CLIENTE' ? (
                        <>
                            <NavLink to="/DashboardCliente" className="menu-link">📊 Visão Geral</NavLink>
                            <NavLink to="/meus-veiculos" className="menu-link">🚗 Meus Veículos</NavLink>
                            <NavLink to="/minhas-os" className="menu-link">🛠️ Ordens de Serviço</NavLink>
                            <NavLink to="/meu-perfil" className="menu-link">👤 Meu Perfil</NavLink>
                        </>
                    ) : (
                        <>
                            <NavLink to="/dashboard" className="menu-link">📊 Visão Geral</NavLink>
                            <NavLink to="/equipe" className="menu-link">👥 Gestão de Equipe</NavLink>
                        </>
                    )}
                </nav>

                <div style={{ marginTop: 'auto' }}>
                    <button className="btn-logout">Sair do Sistema</button>
                </div>
            </aside>

            <main style={{ flex: 1, padding: '48px', display: 'flex', flexDirection: 'column' }}>
                <header style={{ marginBottom: '40px' }}>
                    <h1 style={{ color: 'var(--gf-primary-dark)', fontSize: '2.2rem', fontWeight: '700' }}>{titulo}</h1>
                    {subtitulo && (
                        <p style={{ color: 'var(--gf-text-muted)', fontSize: '1.1rem', marginTop: '8px' }}>{subtitulo}</p>
                    )}
                </header>
                <div className="glass-card">
                    {children}
                </div>
            </main>
        </div>
    );
}