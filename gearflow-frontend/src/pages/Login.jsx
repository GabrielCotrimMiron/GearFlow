// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setErro('');

        try {
            const response = await api.post('/auth/login', { email, senha });
            console.log('Login aprovado:', response.data);
            navigate('/dashboard');
        } catch (err) {
            setErro('Credenciais inválidas. Verifique o e-mail e a senha.');
        }
    };

    return (
        <div className="login-page">

            {/* Lado Esquerdo - Banner */}
            <div className="login-banner">
                <div>
                    <span style={{ fontSize: '3rem', color: 'var(--gf-accent)' }}>⚙️</span>
                </div>
                <h1 className="login-banner-title">
                    Olá,<br />Gearflow! 👋
                </h1>
                <p className="login-banner-subtitle">
                    Deixe as tarefas manuais da sua oficina no passado.
                    Aumente a produtividade através da automação e poupe imenso tempo!
                </p>
            </div>

            {/* Lado Direito - Formulário */}
            <div className="login-form-container">
                <div className="login-form-box">

                    <div className="login-header-logo">
                        Gearflow
                    </div>

                    <h2 className="login-title">Bem-vindo de volta!</h2>
                    <p className="login-subtitle">
                        Entre com as suas credenciais para gerir o sistema.
                    </p>

                    <form onSubmit={handleLogin}>
                        {erro && <p style={{ color: '#E53E3E', marginBottom: '16px', fontSize: '0.9rem' }}>{erro}</p>}

                        <input
                            type="email"
                            className="login-input"
                            placeholder="seu.email@gearflow.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <input
                            type="password"
                            className="login-input"
                            placeholder="Senha"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            required
                        />

                        <button type="submit" className="btn-login">
                            Entrar
                        </button>
                    </form>

                    <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--gf-text-muted)' }}>
                        Esqueceu a senha? <a href="#" style={{ color: 'var(--gf-primary-dark)', fontWeight: 'bold' }}>Clique aqui</a>
                    </div>

                </div>
            </div>

        </div>
    );
}