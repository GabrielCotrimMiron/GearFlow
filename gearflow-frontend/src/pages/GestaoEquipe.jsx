import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';

export default function Equipe() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [equipe, setEquipe] = useState([]);
    const [termoBusca, setTermoBusca] = useState('');
    const [funcionarioEmEdicao, setFuncionarioEmEdicao] = useState(null);

    const [formData, setFormData] = useState({
        nome: '', email: '', senha: '', cpf: '', nivelAcesso: 'MECANICO'
    });

    useEffect(() => {
        carregarEquipe();
    }, []);

    const carregarEquipe = async () => {
        try {
            const response = await api.get('/funcionarios');
            const lista = Array.isArray(response.data)
                ? response.data
                : (response.data?.content || []);
            setEquipe(lista);
        } catch (error) {
            console.error("Erro ao buscar dados da equipe", error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const abrirModalNovo = () => {
        setFuncionarioEmEdicao(null);
        setFormData({ nome: '', email: '', senha: '', cpf: '', nivelAcesso: 'MECANICO' });
        setIsModalOpen(true);
    };

    const abrirModalEdicao = (func) => {
        setFuncionarioEmEdicao(func);
        setFormData({
            nome: func.nome || '',
            email: func.email || '',
            senha: '',
            cpf: func.cpf || '',
            nivelAcesso: func.nivelAcesso || 'MECANICO'
        });
        setIsModalOpen(true);
    };

    const handleExcluir = async (id) => {
        if (window.confirm('Tem a certeza que deseja excluir este funcionário?')) {
            try {
                await api.delete(`/funcionarios/${id}`);
                carregarEquipe();
            } catch (error) {
                console.error(error);
                alert('Erro ao excluir funcionário.');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (funcionarioEmEdicao) {
                await api.put(`/funcionarios/${funcionarioEmEdicao.id}`, formData);
            } else {
                await api.post('/funcionarios', formData);
            }

            setIsModalOpen(false);
            carregarEquipe();
        } catch (error) {
            console.error(error);
            alert('Erro ao guardar os dados. Verifique o backend.');
        }
    };

    // Filtro direto e instantâneo por Nome ou Matrícula
    const equipeFiltrada = equipe.filter((func) => {
        const busca = termoBusca.trim().toLowerCase();
        if (!busca) return true;

        const nome = String(func.nome || '').toLowerCase();
        const matricula = String(func.matricula || '').toLowerCase();

        return nome.includes(busca) || matricula.includes(busca);
    });

    return (
        <div>
            <div className="equipe-header-actions">
                <input
                    type="text"
                    placeholder="Pesquisar por nome ou matrícula..."
                    className="search-bar"
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                />
                <button className="btn-primary" onClick={abrirModalNovo}>
                    + Adicionar Funcionário
                </button>
            </div>

            <div className="equipe-grid">
                {equipeFiltrada.length === 0 ? (
                    <p style={{ color: 'var(--gf-text-muted)', marginTop: '16px' }}>
                        {termoBusca
                            ? `Nenhum funcionário encontrado para "${termoBusca}".`
                            : 'Nenhum funcionário cadastrado.'}
                    </p>
                ) : (
                    equipeFiltrada.map((func, index) => (
                        <div key={func.id ?? `${func.email}-${index}`} className="employee-card">
                            <span className="badge-active">ATIVO</span>
                            <div className="card-profile">
                                <div className="avatar-placeholder">
                                    {func.nome ? func.nome.charAt(0).toUpperCase() : '?'}
                                </div>
                                <div>
                                    <h3 style={{ color: 'var(--gf-primary-dark)', fontSize: '1.1rem' }}>
                                        {func.nome || 'Sem nome'}
                                    </h3>
                                    <span style={{ color: 'var(--gf-text-muted)', fontSize: '0.85rem', textTransform: 'capitalize' }}>
                                        {func.nivelAcesso ? func.nivelAcesso.toLowerCase() : 'mecânico'}
                                    </span>
                                </div>
                            </div>
                            <div className="card-info">
                                <p>✉️ {func.email}</p>
                                <p>🏷️ Matrícula: {func.matricula}</p>
                            </div>
                            <div className="card-actions">
                                <button className="btn-action btn-edit" onClick={() => abrirModalEdicao(func)}>
                                    Editar
                                </button>
                                <button className="btn-action btn-view" style={{ color: '#E53E3E' }} onClick={() => handleExcluir(func.id)}>
                                    Excluir
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isModalOpen && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 style={{ color: 'var(--gf-primary-dark)' }}>
                                {funcionarioEmEdicao ? 'Editar Funcionário' : 'Novo Funcionário'}
                            </h2>
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
                                <input type="text" name="cpf" value={formData.cpf} onChange={handleChange} className="form-input" required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Cargo (Nível de Acesso)</label>
                                <select
                                    name="nivelAcesso"
                                    value={formData.nivelAcesso}
                                    onChange={handleChange}
                                    className="form-input"
                                >
                                    <option value="MECANICO">Mecânico</option>
                                    <option value="GERENTE">Gerente</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Senha {funcionarioEmEdicao && '(Deixe em branco para manter)'}</label>
                                <input
                                    type="password"
                                    name="senha"
                                    value={formData.senha}
                                    onChange={handleChange}
                                    className="form-input"
                                    required={!funcionarioEmEdicao}
                                />
                            </div>

                            <button type="submit" className="btn-submit">
                                {funcionarioEmEdicao ? 'Guardar Alterações' : 'Gravar Funcionário'}
                            </button>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}