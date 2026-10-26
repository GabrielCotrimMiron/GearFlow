import { useState } from 'react';
import api from '../services/api';

export default function Equipe() {
    // Estado para abrir/fechar o modal
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Estado para armazenar a lista de mecânicos visíveis na tela
    const [equipe, setEquipe] = useState([
        { id: 1, nome: 'João Mecânico', email: 'joao@gearflow.com', matricula: '2026001', status: 'ATIVO' }
    ]);

    // Estado para os campos do formulário
    const [formData, setFormData] = useState({
        nome: '', email: '', senha: '', cpf: '',
    });

    // Atualiza os dados conforme o usuário digita
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Envia os dados para o Spring Boot
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Faz o POST para o seu backend
            const response = await api.post('/funcionarios', formData);

            // Adiciona o funcionário recém-criado (retornado pela API) à lista na tela
            const novoMecanico = { ...response.data, status: 'ATIVO' };
            setEquipe([...equipe, novoMecanico]);

            // Fecha o modal e limpa os campos
            setIsModalOpen(false);
            setFormData({ nome: '', email: '', senha: '', cpf: ''});

        } catch (error) {
            console.error(error);
            alert('Erro ao cadastrar mecânico. Verifique se o backend está a correr.');
        }
    };

    return (
        <div>
            <div className="equipe-header-actions">
                <input type="text" placeholder="Pesquisar por nome ou matrícula..." className="search-bar" />
                {/* Botão que abre o modal */}
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                    + Adicionar Mecânico
                </button>
            </div>

            <div className="equipe-grid">
                {equipe.map((func) => (
                    <div key={func.id} className="employee-card">
                        <span className="badge-active">{func.status || 'ATIVO'}</span>
                        <div className="card-profile">
                            <div className="avatar-placeholder">{func.nome.charAt(0)}</div>
                            <div>
                                <h3 style={{ color: 'var(--gf-primary-dark)', fontSize: '1.1rem' }}>{func.nome}</h3>
                                <span style={{ color: 'var(--gf-text-muted)', fontSize: '0.85rem' }}>Mecânico</span>
                            </div>
                        </div>
                        <div className="card-info">
                            <p>✉️ {func.email}</p>
                            <p>🏷️ Matrícula: {func.matricula}</p>
                        </div>
                        <div className="card-actions">
                            <button className="btn-action btn-edit">Editar</button>
                            <button className="btn-action btn-view">Ver</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL DE CADASTRO */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">

                        <div className="modal-header">
                            <h2 style={{ color: 'var(--gf-primary-dark)' }}>Novo Mecânico</h2>
                            <button className="btn-close" onClick={() => setIsModalOpen(false)}>×</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Nome Completo</label>
                                <input type="text" name="nome" value={formData.nome} onChange={handleChange} className="form-input" required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">E-mail</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">CPF</label>
                                <input
                                    type="text"
                                    name="cpf"
                                    value={formData.cpf}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Senha Provisória</label>
                                <input type="password" name="senha" value={formData.senha} onChange={handleChange} className="form-input" required />
                            </div>

                            <button type="submit" className="btn-submit">Gravar Mecânico</button>
                        </form>

                    </div>
                </div>
            )}
        </div>
    );
}