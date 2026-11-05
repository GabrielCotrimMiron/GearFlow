import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';

export default function GestaoOrdensServico() {
    const [ordens, setOrdens] = useState([]);
    const [veiculos, setVeiculos] = useState([]);
    const [funcionarios, setFuncionarios] = useState([]);
    const [termoBusca, setTermoBusca] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [osDetalhe, setOsDetalhe] = useState(null);

    const hoje = new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        veiculoId: '',
        funcionarioId: '',
        dataEntrada: hoje,
        previsaoEntrega: '',
        prioridade: 'NORMAL',
        obsDiag: ''
    });

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        try {
            const [resOS, resVeic, resFunc] = await Promise.all([
                api.get('/ordens-servico'),
                api.get('/veiculos'),
                api.get('/funcionarios')
            ]);

            setOrdens(Array.isArray(resOS.data) ? resOS.data : []);
            setVeiculos(Array.isArray(resVeic.data) ? resVeic.data : []);
            setFuncionarios(Array.isArray(resFunc.data) ? resFunc.data : []);
        } catch (error) {
            console.error("Erro ao carregar dados de Ordens de Serviço:", error);
        }
    };

    const abrirModalNovaOS = () => {
        setFormData({
            veiculoId: '',
            funcionarioId: '',
            dataEntrada: hoje,
            previsaoEntrega: '',
            prioridade: 'NORMAL',
            obsDiag: ''
        });
        setIsModalOpen(true);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                veiculoId: parseInt(formData.veiculoId, 10),
                funcionarioId: formData.funcionarioId ? parseInt(formData.funcionarioId, 10) : null,
                dataEntrada: formData.dataEntrada,
                previsaoEntrega: formData.previsaoEntrega,
                prioridade: formData.prioridade,
                obsDiag: formData.obsDiag
            };

            await api.post('/ordens-servico', payload);
            setIsModalOpen(false);
            carregarDados();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || 'Erro ao abrir Ordem de Serviço. Verifique se a previsão de entrega é válida.';
            alert(msg);
        }
    };

    const handleAlterarPrioridade = async (id, novaPrioridade) => {
        try {
            await api.put(`/ordens-servico/${id}/prioridade?prioridade=${novaPrioridade}`);
            carregarDados();
            if (osDetalhe && osDetalhe.id === id) {
                setOsDetalhe({ ...osDetalhe, prioridade: novaPrioridade });
            }
        } catch (error) {
            console.error(error);
            alert('Não foi possível alterar a prioridade desta OS.');
        }
    };

    const formatarData = (dataStr) => {
        if (!dataStr) return 'Não definida';
        const [ano, mes, dia] = dataStr.split('-');
        return `${dia}/${mes}/${ano}`;
    };

    const estiloPrioridade = (prioridade) => {
        if (prioridade === 'URGENTE') {
            return { backgroundColor: '#FED7D7', color: '#C53030' };
        }
        if (prioridade === 'ALTA') {
            return { backgroundColor: '#FEEBC8', color: '#C05621' };
        }
        return {};
    };

    const ordensFiltradas = ordens.filter((os) => {
        const busca = termoBusca.trim().toLowerCase();
        if (!busca) return true;

        const placa = String(os.veiculo?.placa || '').toLowerCase();
        const modelo = String(os.veiculo?.modelo || '').toLowerCase();
        const cliente = String(os.veiculo?.cliente?.nome || '').toLowerCase();
        const mecanico = String(os.mecanResp?.nome || '').toLowerCase();
        const idStr = String(os.id || '');

        return (
            placa.includes(busca) ||
            modelo.includes(busca) ||
            cliente.includes(busca) ||
            mecanico.includes(busca) ||
            idStr.includes(busca)
        );
    });

    return (
        <div>
            <div className="equipe-header-actions">
                <input
                    type="text"
                    placeholder="Pesquisar por nº da OS, matrícula/placa, veículo, cliente ou mecânico..."
                    className="search-bar"
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                />
                <button className="btn-primary" onClick={abrirModalNovaOS}>
                    + Nova Ordem de Serviço
                </button>
            </div>

            <div className="equipe-grid">
                {ordensFiltradas.length === 0 ? (
                    <p style={{ color: 'var(--gf-text-muted)', marginTop: '16px' }}>
                        {termoBusca
                            ? `Nenhuma Ordem de Serviço encontrada para "${termoBusca}".`
                            : 'Nenhuma Ordem de Serviço registada no momento.'}
                    </p>
                ) : (
                    ordensFiltradas.map((os) => (
                        <div
                            key={os.id}
                            className="employee-card"
                            onClick={() => setOsDetalhe(os)}
                            style={{ cursor: 'pointer' }}
                        >
                            <span
                                className="badge-active"
                                style={estiloPrioridade(os.prioridade)}
                            >
                                {os.prioridade || 'NORMAL'} • {os.statusOperac || 'ABERTA'}
                            </span>

                            <div className="card-profile">
                                <div className="avatar-placeholder">
                                    📋
                                </div>
                                <div>
                                    <h3 style={{ color: 'var(--gf-primary-dark)', fontSize: '1.1rem' }}>
                                        OS #{os.id} — {os.veiculo ? `${os.veiculo.marca} ${os.veiculo.modelo}` : 'Veículo'}
                                    </h3>
                                    <span style={{ color: 'var(--gf-text-muted)', fontSize: '0.85rem' }}>
                                        Placa: <strong>{os.veiculo?.placa || 'N/A'}</strong>
                                        {os.veiculo?.cliente?.nome ? ` | Cliente: ${os.veiculo.cliente.nome}` : ''}
                                    </span>
                                </div>
                            </div>

                            <div className="card-info">
                                <p>📅 Entrada: <strong>{formatarData(os.dataEntrada)}</strong></p>
                                <p>🏁 Previsão Entrega: <strong>{formatarData(os.previsaoEntrega)}</strong></p>
                                <p>👨‍🔧 Mecânico: <strong>{os.mecanResp?.nome || 'Não designado'}</strong></p>
                            </div>

                            <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                                <select
                                    className="form-input"
                                    style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                                    value={os.prioridade || 'NORMAL'}
                                    onChange={(e) => handleAlterarPrioridade(os.id, e.target.value)}
                                >
                                    <option value="NORMAL">Prioridade: Normal</option>
                                    <option value="ALTA">Prioridade: Alta</option>
                                    <option value="URGENTE">Prioridade: Urgente</option>
                                </select>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* MODAL DE DETALHES DA OS */}
            {osDetalhe && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 style={{ color: 'var(--gf-primary-dark)' }}>
                                Ficha da Ordem de Serviço #{osDetalhe.id}
                            </h2>
                            <button className="btn-close" onClick={() => setOsDetalhe(null)}>×</button>
                        </div>

                        <div className="card-info" style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '1rem', marginTop: '12px' }}>
                            <p><strong>Status Operacional:</strong> {osDetalhe.statusOperac}</p>
                            <p><strong>Prioridade:</strong> {osDetalhe.prioridade}</p>
                            <p><strong>Status do Pagamento:</strong> {osDetalhe.statusPag}</p>
                            <p><strong>Veículo:</strong> {osDetalhe.veiculo ? `${osDetalhe.veiculo.marca} ${osDetalhe.veiculo.modelo} (${osDetalhe.veiculo.placa})` : 'N/A'}</p>
                            <p><strong>Cliente Proprietário:</strong> {osDetalhe.veiculo?.cliente?.nome || 'N/A'}</p>
                            <p><strong>Mecânico Responsável:</strong> {osDetalhe.mecanResp?.nome || 'Não atribuído'}</p>
                            <p><strong>Data de Entrada:</strong> {formatarData(osDetalhe.dataEntrada)}</p>
                            <p><strong>Previsão de Entrega:</strong> {formatarData(osDetalhe.previsaoEntrega)}</p>
                            <p><strong>Observações / Queixa Inicial:</strong> {osDetalhe.obsDiag || 'Sem observações registadas.'}</p>
                        </div>

                        <div className="card-actions" style={{ marginTop: '24px' }}>
                            <button type="button" className="btn-action btn-view" onClick={() => setOsDetalhe(null)}>
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* MODAL DE CRIAÇÃO DE OS (RF06 / RF16) */}
            {isModalOpen && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 style={{ color: 'var(--gf-primary-dark)' }}>
                                Abrir Nova Ordem de Serviço
                            </h2>
                            <button className="btn-close" onClick={() => setIsModalOpen(false)}>×</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Veículo (Frota Cadastrada)</label>
                                <select
                                    name="veiculoId"
                                    value={formData.veiculoId}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                >
                                    <option value="">Selecione um veículo...</option>
                                    {veiculos.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.placa} — {v.marca} {v.modelo} {v.cliente?.nome ? `(Cliente: ${v.cliente.nome})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Mecânico Responsável</label>
                                <select
                                    name="funcionarioId"
                                    value={formData.funcionarioId}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                >
                                    <option value="">Selecione o profissional responsável...</option>
                                    {funcionarios.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.nome} ({f.cargo || 'Mecânico'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Prioridade do Atendimento</label>
                                <select
                                    name="prioridade"
                                    value={formData.prioridade}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                >
                                    <option value="NORMAL">Normal</option>
                                    <option value="ALTA">Alta</option>
                                    <option value="URGENTE">Urgente</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Data de Entrada</label>
                                <input
                                    type="date"
                                    name="dataEntrada"
                                    value={formData.dataEntrada}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Previsão de Entrega</label>
                                <input
                                    type="date"
                                    name="previsaoEntrega"
                                    min={formData.dataEntrada || hoje}
                                    value={formData.previsaoEntrega}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Relato do Cliente / Diagnóstico Inicial</label>
                                <textarea
                                    name="obsDiag"
                                    rows="3"
                                    placeholder="Ex: Cliente relata barulho na roda dianteira direita ao travar..."
                                    value={formData.obsDiag}
                                    onChange={handleChange}
                                    className="form-input"
                                />
                            </div>

                            <button type="submit" className="btn-submit">
                                Gerar Ordem de Serviço
                            </button>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}