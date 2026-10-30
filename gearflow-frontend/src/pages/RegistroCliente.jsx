import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function RegistroCliente() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nome: '', email: '', cpf: '', telefone: '', senha: ''
    });
    const [erro, setErro] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');
        try {
            await api.post('/clientes/registro', formData);
            alert('Conta criada com sucesso! Faça login para aceder ao painel.');
            navigate('/');
        } catch (err) {
            setErro('Erro ao criar conta. Verifique os dados e a ligação ao servidor.');
        }
    };

    return (
        <div className="login-page" style={{ justifyContent: 'center', backgroundColor: 'var(--gf-surface)' }}>
            <div className="login-form-container" style={{ flex: 'none', width: '100%', maxWidth: '500px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                <div className="login-form-box">
                    <h2 className="login-title">Criar Conta</h2>
                    <p className="login-subtitle">Registe-se para solicitar serviços e orçamentos na Gearflow.</p>

                    <form onSubmit={handleSubmit}>
                        {erro && <p style={{ color: '#E53E3E', marginBottom: '16px', fontSize: '0.9rem' }}>{erro}</p>}

                        <input type="text" name="nome" placeholder="Nome Completo" className="login-input" onChange={handleChange} required />
                        <input type="email" name="email" placeholder="E-mail" className="login-input" onChange={handleChange} required />
                        <input type="text" name="cpf" placeholder="CPF" className="login-input" onChange={handleChange} required />
                        <input type="text" name="telefone" placeholder="Telefone" className="login-input" onChange={handleChange} required />
                        <input type="password" name="senha" placeholder="Senha" className="login-input" onChange={handleChange} required />

                        <button type="submit" className="btn-login">Registar</button>
                    </form>

                    <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem' }}>
                        Já tem uma conta? <Link to="/" style={{ color: 'var(--gf-primary-dark)', fontWeight: 'bold' }}>Faça Login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}