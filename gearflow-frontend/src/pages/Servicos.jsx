import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';

export default function CatalogoServicos() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [servicos, setServicos] = useState([]);
    const [termoBusca, setTermoBusca] = useState('');
    const [servicoEmEdicao, setServicoEmEdicao] = useState(null);
    const [servicoDetalhe, setServicoDetalhe] = useState(null);

    const [formData, setFormData] = useState({
        descricao: '',
        categoria: '',
        valorUni: '',
        tempoEstim: ''
    });

    useEffect(() => {
        carregarServicos();
    }, []);

    const carregarServicos = async () => {
        try {
            const response = await api.get('/servicos');
            const lista = Array.isArray(response.data)
                ? response.data
                : (response.data?.content || []);
            setServicos(lista);
        } catch (error) {
            console.error("Erro ao procurar catálogo de serviços", error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const abrirModalNovo = () => {
        setServicoEmEdicao(null);
        setFormData({ descricao: '', categoria: '', valorUni: '', tempoEstim: '' });
        setIsModalOpen(true);
    };

    const abrirModalEdicao = (serv) => {
        setServicoEmEdicao(serv);
        setFormData({
            descricao: serv.descricao || '',
            categoria: serv.categoria || '',
            valorUni: serv.valorUni ?? '',
            tempoEstim: serv.tempoEstim ?? ''
        });
        setIsModalOpen(true);
    };

    const handleExcluir = async (id) => {
        if (window.confirm('Tem a certeza que deseja excluir este serviço do catálogo?')) {
            try {
                await api.delete(`/servicos/${id}`);
                carregarServicos();
            } catch (error) {
                console.error(error);
                alert('Erro ao excluir serviço.');
            }
        }
    };

    const handleAplicarDesconto = async (serv) => {
        const input = window.prompt(`Informe a porcentagem de desconto para "${serv.descricao}" (ex: 10 para 10%):`);
        if (!input) return;

        const porcentagem = parseFloat(input);
        if (isNaN(porcentagem) || porcentagem <= 0 || porcentagem > 100) {
            alert('Porcentagem inválida. Digite um valor entre 1 e 100.');
            return;
        }

        try {
            const response = await api.patch(`/servicos/${serv.id}/desconto?porcentagem=${porcentagem}`);
            setServicoDetalhe(response.data);
            carregarServicos();
        } catch (error) {
            console.error(error);
            alert('Erro ao aplicar desconto no serviço.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                descricao: formData.descricao,
                categoria: formData.categoria,
                valorUni: parseFloat(formData.valorUni),
                tempoEstim: parseInt(formData.tempoEstim, 10),
                qtd: 1
            };

            if (servicoEmEdicao) {
                await api.put(`/servicos/${servicoEmEdicao.id}`, payload);
            } else {
                await api.post('/servicos', payload);
            }

            setIsModalOpen(false);
            carregarServicos();
        } catch (error) {
            console.error(error);
            alert('Erro ao guardar os dados do serviço. Verifique o backend.');
        }
    };

    const servicosFiltrados = servicos.filter((serv) => {
        const busca = termoBusca.trim().toLowerCase();
        if (!busca) return true;

        const descricao = String(serv.descricao || '').toLowerCase();
        const categoria = String(serv.categoria || '').toLowerCase();

        return descricao.includes(busca) || categoria.includes(busca);
    });

    const formatarMoeda = (valor) => {
        const numero = Number(valor || 0);
        return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <div>
            <div className="equipe-header-actions">
                <input
                    type="text"
                    placeholder="Pesquisar por descrição ou categoria..."
                    className="search-bar"
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                />
                <button className="btn-primary" onClick={abrirModalNovo}>
                    + Adicionar Serviço
                </button>
            </div>

            <div className="equipe-grid">
                {servicosFiltrados.length === 0 ? (
                    <p style={{ color: 'var(--gf-text-muted)', marginTop: '16px' }}>
                        {termoBusca
                            ? `Nenhum serviço encontrado para "${termoBusca}".`
                            : 'Nenhum serviço registado no catálogo.'}
                    </p>
                ) : (
                    servicosFiltrados.map((serv, index) => (
                        <div
                            key={serv.id ?? `${serv.descricao}-${index}`}
                            className="employee-card"
                            onClick={() => setServicoDetalhe(serv)}
                            style={{ cursor: 'pointer' }}
                        >
                            <span className="badge-active">
                                {serv.categoria ? serv.categoria.toUpperCase() : 'SERVIÇO'}
                            </span>

                            <div className="card-profile">
                                <div className="avatar-placeholder">
                                    🛠️
                                </div>
                                <div>
                                    <h3 style={{ color: 'var(--gf-primary-dark)', fontSize: '1.1rem' }}>
                                        {serv.descricao || 'Sem descrição'}
                                    </h3>
                                    <span style={{ color: 'var(--gf-text-muted)', fontSize: '0.85rem' }}>
                                        Categoria: {serv.categoria || 'Geral'}
                                    </span>
                                </div>
                            </div>

                            <div className="card-info">
                                <p>💰 Mão de Obra: <strong>{formatarMoeda(serv.valorUni)}</strong></p>
                                <p>⏱️ Tempo Estimado: <strong>{serv.tempoEstim ?? 0} min</strong></p>
                            </div>

                            <div className="card-actions">
                                <button
                                    className="btn-action btn-edit"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        abrirModalEdicao(serv);
                                    }}
                                >
                                    Editar
                                </button>
                                <button
                                    className="btn-action btn-view"
                                    style={{ color: '#E53E3E' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleExcluir(serv.id);
                                    }}
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* MODAL DE DETALHES DO SERVIÇO */}
            {servicoDetalhe && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 style={{ color: 'var(--gf-primary-dark)' }}>Detalhes do Serviço</h2>
                            <button className="btn-close" onClick={() => setServicoDetalhe(null)}>×</button>
                        </div>

                        <div className="card-info" style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '1rem', marginTop: '12px' }}>
                            <p><strong>ID no Sistema:</strong> #{servicoDetalhe.id}</p>
                            <p><strong>Descrição da Mão de Obra:</strong> {servicoDetalhe.descricao}</p>
                            <p><strong>Categoria:</strong> {servicoDetalhe.categoria || 'Geral'}</p>
                            <p><strong>Preço Fixo:</strong> {formatarMoeda(servicoDetalhe.valorUni)}</p>
                            <p><strong>Tempo Estimado:</strong> {servicoDetalhe.tempoEstim ?? 0} minutos</p>
                        </div>

                        <div className="card-actions" style={{ marginTop: '24px' }}>
                            <button
                                type="button"
                                className="btn-action btn-edit"
                                onClick={() => handleAplicarDesconto(servicoDetalhe)}
                            >
                                % Desconto
                            </button>
                            <button
                                type="button"
                                className="btn-action btn-edit"
                                onClick={() => {
                                    const serv = servicoDetalhe;
                                    setServicoDetalhe(null);
                                    abrirModalEdicao(serv);
                                }}
                            >
                                Editar
                            </button>
                            <button type="button" className="btn-action btn-view" onClick={() => setServicoDetalhe(null)}>
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* MODAL DE CADASTRO / EDIÇÃO */}
            {isModalOpen && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 style={{ color: 'var(--gf-primary-dark)' }}>
                                {servicoEmEdicao ? 'Editar Serviço' : 'Novo Serviço'}
                            </h2>
                            <button className="btn-close" onClick={() => setIsModalOpen(false)}>×</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Descrição do Serviço (Mão de Obra)</label>
                                <input
                                    type="text"
                                    name="descricao"
                                    placeholder="Ex: Troca de Óleo e Filtro"
                                    value={formData.descricao}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Categoria</label>
                                <input
                                    type="text"
                                    name="categoria"
                                    placeholder="Ex: Motor, Freios, Suspensão..."
                                    value={formData.categoria}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Preço Fixo (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    name="valorUni"
                                    placeholder="Ex: 120.00"
                                    value={formData.valorUni}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Tempo Estimado (em minutos)</label>
                                <input
                                    type="number"
                                    min="1"
                                    name="tempoEstim"
                                    placeholder="Ex: 45"
                                    value={formData.tempoEstim}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <button type="submit" className="btn-submit">
                                {servicoEmEdicao ? 'Guardar Alterações' : 'Gravar Serviço'}
                            </button>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}