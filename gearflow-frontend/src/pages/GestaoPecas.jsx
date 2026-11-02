import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';

export default function GestaoPecas() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pecas, setPecas] = useState([]);
    const [termoBusca, setTermoBusca] = useState('');
    const [pecaEmEdicao, setPecaEmEdicao] = useState(null);
    const [pecaDetalhe, setPecaDetalhe] = useState(null); // <-- Estado para o modal de visualização

    const [formData, setFormData] = useState({
        descricao: '',
        codFabri: '',
        valorUni: '',
        qtdEstoque: ''
    });

    useEffect(() => {
        carregarPecas();
    }, []);

    const carregarPecas = async () => {
        try {
            const response = await api.get('/pecas');
            const lista = Array.isArray(response.data)
                ? response.data
                : (response.data?.content || []);
            setPecas(lista);
        } catch (error) {
            console.error("Erro ao procurar dados de peças", error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const abrirModalNovo = () => {
        setPecaEmEdicao(null);
        setFormData({ descricao: '', codFabri: '', valorUni: '', qtdEstoque: '' });
        setIsModalOpen(true);
    };

    const abrirModalEdicao = (peca) => {
        setPecaEmEdicao(peca);
        setFormData({
            descricao: peca.descricao || '',
            codFabri: peca.codFabri || '',
            valorUni: peca.valorUni ?? '',
            qtdEstoque: peca.qtdEstoque ?? ''
        });
        setIsModalOpen(true);
    };

    const handleExcluir = async (id) => {
        if (window.confirm('Tem a certeza que deseja excluir esta peça do estoque?')) {
            try {
                await api.delete(`/pecas/${id}`);
                carregarPecas();
            } catch (error) {
                console.error(error);
                alert('Erro ao excluir peça.');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                descricao: formData.descricao,
                codFabri: formData.codFabri,
                valorUni: parseFloat(formData.valorUni),
                qtdEstoque: parseInt(formData.qtdEstoque, 10),
                qtd: 0
            };

            if (pecaEmEdicao) {
                await api.put(`/pecas/${pecaEmEdicao.id}`, payload);
            } else {
                await api.post('/pecas', payload);
            }

            setIsModalOpen(false);
            carregarPecas();
        } catch (error) {
            console.error(error);
            alert('Erro ao guardar os dados da peça. Verifique o backend.');
        }
    };

    const pecasFiltradas = pecas.filter((peca) => {
        const busca = termoBusca.trim().toLowerCase();
        if (!busca) return true;

        const descricao = String(peca.descricao || '').toLowerCase();
        const codFabri = String(peca.codFabri || '').toLowerCase();

        return descricao.includes(busca) || codFabri.includes(busca);
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
                    placeholder="Pesquisar por descrição ou código..."
                    className="search-bar"
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                />
                <button className="btn-primary" onClick={abrirModalNovo}>
                    + Adicionar Peça
                </button>
            </div>

            <div className="equipe-grid">
                {pecasFiltradas.length === 0 ? (
                    <p style={{ color: 'var(--gf-text-muted)', marginTop: '16px' }}>
                        {termoBusca
                            ? `Nenhuma peça encontrada para "${termoBusca}".`
                            : 'Nenhuma peça registada no estoque.'}
                    </p>
                ) : (
                    pecasFiltradas.map((peca, index) => {
                        const estoqueBaixo = peca.estoqueBaixo ?? (peca.qtdEstoque ?? 0) <= 5;

                        return (
                            <div
                                key={peca.id ?? `${peca.codFabri}-${index}`}
                                className="employee-card"
                                onClick={() => setPecaDetalhe(peca)}
                                style={{ cursor: 'pointer' }}
                            >
                                <span
                                    className="badge-active"
                                    style={estoqueBaixo ? { backgroundColor: '#FED7D7', color: '#C53030' } : {}}
                                >
                                    {estoqueBaixo ? 'ESTOQUE BAIXO' : 'EM ESTOQUE'}
                                </span>

                                <div className="card-profile">
                                    <div className="avatar-placeholder">
                                        🔧
                                    </div>
                                    <div>
                                        <h3 style={{ color: 'var(--gf-primary-dark)', fontSize: '1.1rem' }}>
                                            {peca.descricao || 'Sem descrição'}
                                        </h3>
                                        <span style={{ color: 'var(--gf-text-muted)', fontSize: '0.85rem' }}>
                                            Cód: {peca.codFabri || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                <div className="card-info">
                                    <p>💰 Preço Unitário: <strong>{formatarMoeda(peca.valorUni)}</strong></p>
                                    <p>📦 Quantidade: <strong>{peca.qtdEstoque ?? 0} un.</strong></p>
                                </div>

                                <div className="card-actions">
                                    <button
                                        className="btn-action btn-edit"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            abrirModalEdicao(peca);
                                        }}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        className="btn-action btn-view"
                                        style={{ color: '#E53E3E' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleExcluir(peca.id);
                                        }}
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* MODAL DE DETALHES DA PEÇA (AO CLICAR NO CARD) */}
            {pecaDetalhe && createPortal(
                <div className="modal-overlay" onClick={() => setPecaDetalhe(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 style={{ color: 'var(--gf-primary-dark)' }}>Detalhes da Peça</h2>
                            <button className="btn-close" onClick={() => setPecaDetalhe(null)}>×</button>
                        </div>

                        <div className="card-info" style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '1rem', marginTop: '12px' }}>
                            <p><strong>ID no Sistema:</strong> #{pecaDetalhe.id}</p>
                            <p><strong>Descrição:</strong> {pecaDetalhe.descricao}</p>
                            <p><strong>Código do Fabricante:</strong> {pecaDetalhe.codFabri}</p>
                            <p><strong>Valor Unitário:</strong> {formatarMoeda(pecaDetalhe.valorUni)}</p>
                            <p><strong>Quantidade em Estoque:</strong> {pecaDetalhe.qtdEstoque ?? 0} unidades</p>
                            <p><strong>Valor Total em Estoque:</strong> {formatarMoeda((pecaDetalhe.valorUni || 0) * (pecaDetalhe.qtdEstoque || 0))}</p>
                            <p>
                                <strong>Status:</strong>{' '}
                                {(pecaDetalhe.estoqueBaixo ?? (pecaDetalhe.qtdEstoque ?? 0) <= 5)
                                    ? '⚠️ Estoque Baixo (Reabastecer)'
                                    : '✅ Estoque Normal'}
                            </p>
                        </div>

                        <div className="card-actions" style={{ marginTop: '24px' }}>
                            <button
                                className="btn-action btn-edit"
                                onClick={() => {
                                    const peca = pecaDetalhe;
                                    setPecaDetalhe(null);
                                    abrirModalEdicao(peca);
                                }}
                            >
                                Editar Peça
                            </button>
                            <button className="btn-action btn-view" onClick={() => setPecaDetalhe(null)}>
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
                                {pecaEmEdicao ? 'Editar Peça' : 'Nova Peça'}
                            </h2>
                            <button className="btn-close" onClick={() => setIsModalOpen(false)}>×</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Descrição da Peça</label>
                                <input
                                    type="text"
                                    name="descricao"
                                    placeholder="Ex: Pastilha de Freio Dianteira"
                                    value={formData.descricao}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Código do Fabricante</label>
                                <input
                                    type="text"
                                    name="codFabri"
                                    placeholder="Ex: COB-1234"
                                    value={formData.codFabri}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Valor Unitário (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    name="valorUni"
                                    placeholder="Ex: 89.90"
                                    value={formData.valorUni}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Quantidade em Estoque</label>
                                <input
                                    type="number"
                                    min="0"
                                    name="qtdEstoque"
                                    placeholder="Ex: 15"
                                    value={formData.qtdEstoque}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <button type="submit" className="btn-submit">
                                {pecaEmEdicao ? 'Guardar Alterações' : 'Gravar Peça'}
                            </button>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}