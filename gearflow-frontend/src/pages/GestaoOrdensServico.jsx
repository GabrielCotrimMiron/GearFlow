
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { gerarAutorizacaoBasica } from '../services/clienteAuth';
import './GestaoOrdensServicoRF09.css';

export default function GestaoOrdensServico() {
    const [ordens, setOrdens] = useState([]);
    const [veiculos, setVeiculos] = useState([]);
    const [funcionarios, setFuncionarios] = useState([]);
    const [termoBusca, setTermoBusca] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [osDetalhe, setOsDetalhe] = useState(null);

    // NOVOS ESTADOS (RF07) - Catálogo e Adição de Itens
    const [catalogoPecas, setCatalogoPecas] = useState([]);
    const [catalogoServicos, setCatalogoServicos] = useState([]);
    const [novoItemTipo, setNovoItemTipo] = useState('PECA'); // 'PECA' ou 'SERVICO'
    const [novoItemId, setNovoItemId] = useState('');
    const [novoItemQtd, setNovoItemQtd] = useState('1');
    const [adicionandoItem, setAdicionandoItem] = useState(false);

    // RF09 - Fechamento de rascunho
    const [desconto, setDesconto] = useState('0');
    const [fechandoRascunho, setFechandoRascunho] = useState(false);
    const [erroFechamento, setErroFechamento] = useState('');
    const [sucessoFechamento, setSucessoFechamento] = useState('');
    const [erroCarregamento, setErroCarregamento] = useState('');
    const [carregando, setCarregando] = useState(true);

    const hoje = new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        veiculoId: '',
        funcionarioId: '',
        dataEntrada: hoje,
        previsaoEntrega: '',
        prioridade: 'NORMAL',
        obsDiag: ''
    });

    // Carregamento inicial com autenticacao
    useEffect(() => {
        let ativo = true;

        async function buscarDadosIniciais() {
            try {
                const autorizacao = gerarAutorizacaoBasica();

                const [resOS, resVeic, resFunc, resPecas, resServicos] = await Promise.all([
                    api.get('/ordens-servico', {
                        headers: { Authorization: autorizacao }
                    }),
                    api.get('/veiculos'),
                    api.get('/funcionarios'),
                    api.get('/pecas', {
                        headers: { Authorization: autorizacao }
                    }),
                    api.get('/servicos', {
                        headers: { Authorization: autorizacao }
                    })
                ]);

                if (!ativo) return;

                setOrdens(
                    Array.isArray(resOS.data) ? resOS.data : []
                );

                setVeiculos(
                    Array.isArray(resVeic.data) ? resVeic.data : []
                );

                setFuncionarios(
                    Array.isArray(resFunc.data) ? resFunc.data : []
                )
                setCatalogoPecas(Array.isArray(resPecas.data) ? resPecas.data : []);
                setCatalogoServicos(Array.isArray(resServicos.data) ? resServicos.data : []);

                setErroCarregamento('');

            } catch (error) {
                if (!ativo) return;

                console.error(
                    'Erro ao carregar ordens de servico:',
                    error
                );

                setErroCarregamento(
                    error.response?.status === 401
                        ? 'Sessão não autorizada. Verifique as credenciais do funcionário.'
                        : error.response?.status === 403
                            ? 'Seu usuário não possui permissão para consultar as ordens.'
                            : 'Não foi possível carregar os dados. Verifique a conexão com o servidor.'
                );

            } finally {
                if (ativo) {
                    setCarregando(false);
                }
            }
        }

        buscarDadosIniciais();

        return () => {
            ativo = false;
        };
    }, []);

    // Atualiza a listagem apos operacoes
    const carregarDados = async () => {
        try {
            const autorizacao = gerarAutorizacaoBasica();

            const [resOS, resVeic, resFunc] = await Promise.all([
                api.get('/ordens-servico', {
                    headers: {
                        Authorization: autorizacao
                    }
                }),
                api.get('/veiculos'),
                api.get('/funcionarios')
            ]);

            setOrdens(
                Array.isArray(resOS.data) ? resOS.data : []
            );

            setVeiculos(
                Array.isArray(resVeic.data) ? resVeic.data : []
            );

            setFuncionarios(
                Array.isArray(resFunc.data) ? resFunc.data : []
            );

            setErroCarregamento('');

        } catch (error) {
            console.error('Erro ao atualizar dados:', error);

            setErroCarregamento(
                'Não foi possível atualizar as ordens de serviço.'
            );
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

    const abrirDetalhesOS = (os) => {
        setOsDetalhe(os);
        setDesconto(String(os.desconto ?? 0));
        setErroFechamento('');
        setSucessoFechamento('');
    };

    const fecharDetalhesOS = () => {
        if (fechandoRascunho) return;

        setOsDetalhe(null);
        setErroFechamento('');
        setSucessoFechamento('');
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                veiculoId: parseInt(formData.veiculoId, 10),
                funcionarioId: formData.funcionarioId
                    ? parseInt(formData.funcionarioId, 10)
                    : null,
                dataEntrada: formData.dataEntrada,
                previsaoEntrega: formData.previsaoEntrega,
                prioridade: formData.prioridade,
                obsDiag: formData.obsDiag
            };

            await api.post('/ordens-servico', payload, {
                headers: {
                    Authorization: gerarAutorizacaoBasica()
                }
            });

            setIsModalOpen(false);
            await carregarDados();

        } catch (error) {
            console.error(error);

            const msg =
                error.response?.data?.message ||
                'Erro ao abrir Ordem de Serviço. Verifique os dados informados.';

            alert(msg);
        }
    };

    const handleAlterarPrioridade = async (id, novaPrioridade) => {
        try {
            await api.put(
                `/ordens-servico/${id}/prioridade`,
                null,
                {
                    params: {
                        prioridade: novaPrioridade
                    },
                    headers: {
                        Authorization: gerarAutorizacaoBasica()
                    }
                }
            );

            await carregarDados();

            if (osDetalhe?.id === id) {
                setOsDetalhe({
                    ...osDetalhe,
                    prioridade: novaPrioridade
                });
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

    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(Number(valor) || 0);
    };

    const estiloPrioridade = (prioridade) => {
        if (prioridade === 'URGENTE') {
            return {
                backgroundColor: '#FED7D7',
                color: '#C53030'
            };
        }

        if (prioridade === 'ALTA') {
            return {
                backgroundColor: '#FEEBC8',
                color: '#C05621'
            };
        }

        return {};
    };

    const formatarStatus = (status) => {
        const nomes = {
            ABERTA: 'Aberta',
            EM_ANALISE: 'Em análise',
            AGUARDANDO_APROVACAO: 'Aguardando aprovação',
            EM_EXECUCAO: 'Em execução',
            FINALIZADA: 'Finalizada'
        };

        return nomes[status] || status || 'Não informado';
    };

    const ordensFiltradas = ordens.filter((os) => {
        const busca = termoBusca.trim().toLowerCase();

        if (!busca) return true;

        const placa = String(
            os.veiculo?.placa || ''
        ).toLowerCase();

        const modelo = String(
            os.veiculo?.modelo || ''
        ).toLowerCase();

        const cliente = String(
            os.veiculo?.cliente?.nome || ''
        ).toLowerCase();

        const mecanico = String(
            os.mecanResp?.nome || ''
        ).toLowerCase();

        const idStr = String(os.id || '');

        return (
            placa.includes(busca) ||
            modelo.includes(busca) ||
            cliente.includes(busca) ||
            mecanico.includes(busca) ||
            idStr.includes(busca)
        );
    });

    // RF09 - Calculo do orcamento
    const valorBruto = Number(
        osDetalhe?.valorTotal ?? 0
    );

    const descontoNumerico = Number(desconto);

    const descontoValido =
        desconto.trim() !== '' &&
        Number.isFinite(descontoNumerico) &&
        descontoNumerico >= 0 &&
        descontoNumerico <= valorBruto &&
        /^\d+(\.\d{1,2})?$/.test(desconto);

    const valorFinal = Math.max(
        0,
        valorBruto -
            (descontoValido ? descontoNumerico : 0)
    );

    const podeFecharRascunho =
        osDetalhe?.statusOperac === 'EM_ANALISE';

    // RF09 - Fechamento com autenticacao
    const handleFecharRascunho = async () => {
        if (
            !osDetalhe ||
            !podeFecharRascunho ||
            fechandoRascunho
        ) {
            return;
        }

        setErroFechamento('');
        setSucessoFechamento('');

        if (!descontoValido) {
            setErroFechamento(
                'Informe um desconto válido, entre R$ 0,00 e o subtotal.'
            );
            return;
        }

        const confirmado = window.confirm(
            `Deseja fechar o orçamento da OS #${osDetalhe.id}?\n\n` +
            `Subtotal: ${formatarMoeda(valorBruto)}\n` +
            `Desconto: ${formatarMoeda(descontoNumerico)}\n` +
            `Valor final: ${formatarMoeda(valorFinal)}\n\n` +
            'A OS ficará aguardando aprovação do cliente.'
        );

        if (!confirmado) return;

        setFechandoRascunho(true);

        try {
            const autorizacao = gerarAutorizacaoBasica();

            await api.put(
                `/ordens-servico/${osDetalhe.id}/fechar-rascunho`,
                null,
                {
                    params: {
                        desconto: descontoNumerico.toFixed(2)
                    },
                    headers: {
                        Authorization: autorizacao
                    }
                }
            );

            setOsDetalhe((anterior) => ({
                ...anterior,
                statusOperac: 'AGUARDANDO_APROVACAO',
                desconto: descontoNumerico,
                valorFinal
            }));

            setSucessoFechamento(
                'Orçamento fechado com sucesso! Aguardando aprovação do cliente.'
            );

            await carregarDados();

        } catch (error) {
            console.error(
                'Erro ao fechar orçamento:',
                error
            );

            setErroFechamento(
                error.response?.data?.message ||
                error.response?.data?.detail ||
                'Não foi possível fechar o orçamento. Verifique se a OS possui itens e está em análise.'
            );

        } finally {
            setFechandoRascunho(false);
        }
    };

    // RF07 - Adicionar Peça ou Serviço
    const handleAdicionarItem = async () => {
        if (!osDetalhe || !novoItemId || adicionandoItem) return;

        setAdicionandoItem(true);
        setErroFechamento('');

        try {
            const payload = {
                itemId: parseInt(novoItemId, 10),
                quantidade: parseInt(novoItemQtd, 10) || 1
            };

            await api.post(`/ordens-servico/${osDetalhe.id}/itens`, payload, {
                headers: { Authorization: gerarAutorizacaoBasica() }
            });

            await carregarDados();

            const resPecas = await api.get('/pecas', { headers: { Authorization: gerarAutorizacaoBasica() } });
            setCatalogoPecas(Array.isArray(resPecas.data) ? resPecas.data : []);

            // ==========================================
            // 2. ADICIONE ESTAS LINHAS AQUI PARA ATUALIZAR O MODAL:
            // Busca a OS recém-atualizada e injeta no modal
            const autorizacao = gerarAutorizacaoBasica();
            const resOS = await api.get('/ordens-servico', { headers: { Authorization: autorizacao } });

            // Encontra a mesma OS, mas agora com os dados novos do banco
            const osAtualizada = resOS.data.find(os => os.id === osDetalhe.id);
            if (osAtualizada) {
                setOsDetalhe(osAtualizada);
            }
            // ==========================================

            // Limpa a seleção e recarrega para ver o valor atualizado e o stock abatido
            setNovoItemId('');
            setNovoItemQtd('1');
            await carregarDados();

            // Opcional: Atualizar o osDetalhe atual com os dados recém-carregados
            // se tiveres uma rota de GET específico, ou pedir ao utilizador para reabrir.

            alert("Item adicionado com sucesso!");

        } catch (error) {
            console.error('Erro ao adicionar item:', error);
            const msg = error.response?.data?.message || 'Não foi possível adicionar o item. Verifique o stock.';
            setErroFechamento(msg); // Usamos o mesmo estado de erro para simplificar o ecrã
        } finally {
            setAdicionandoItem(false);
        }
    };

    return (
        <div>
            <div className="equipe-header-actions">
                <input
                    type="text"
                    placeholder="Pesquisar por nº da OS, placa, veículo, cliente ou mecânico..."
                    className="search-bar"
                    value={termoBusca}
                    onChange={(e) =>
                        setTermoBusca(e.target.value)
                    }
                />

                <button
                    className="btn-primary"
                    onClick={abrirModalNovaOS}
                >
                    + Nova Ordem de Serviço
                </button>
            </div>

            {erroCarregamento && (
                <div
                    className="gf-orcamento-feedback gf-feedback-erro"
                    role="alert"
                >
                    {erroCarregamento}
                </div>
            )}

            <div className="equipe-grid">
                {carregando ? (
                    <p style={{
                        color: 'var(--gf-text-muted)',
                        marginTop: '16px'
                    }}>
                        Carregando ordens de serviço...
                    </p>
                ) : ordensFiltradas.length === 0 ? (
                    <p style={{
                        color: 'var(--gf-text-muted)',
                        marginTop: '16px'
                    }}>
                        {termoBusca
                            ? `Nenhuma Ordem de Serviço encontrada para "${termoBusca}".`
                            : erroCarregamento
                                ? 'A listagem não pôde ser carregada.'
                                : 'Nenhuma Ordem de Serviço registrada no momento.'}
                    </p>
                ) : (
                    ordensFiltradas.map((os) => (
                        <div
                            key={os.id}
                            className="employee-card"
                            onClick={() =>
                                abrirDetalhesOS(os)
                            }
                            style={{ cursor: 'pointer' }}
                        >
                            <span
                                className="badge-active"
                                style={estiloPrioridade(os.prioridade)}
                            >
                                {os.prioridade || 'NORMAL'}
                                {' • '}
                                {formatarStatus(os.statusOperac)}
                            </span>

                            <div className="card-profile">
                                <div className="avatar-placeholder">
                                    📋
                                </div>

                                <div>
                                    <h3 style={{
                                        color: 'var(--gf-primary-dark)',
                                        fontSize: '1.1rem'
                                    }}>
                                        OS #{os.id} —{' '}
                                        {os.veiculo
                                            ? `${os.veiculo.marca} ${os.veiculo.modelo}`
                                            : 'Veículo'}
                                    </h3>

                                    <span style={{
                                        color: 'var(--gf-text-muted)',
                                        fontSize: '0.85rem'
                                    }}>
                                        Placa:{' '}
                                        <strong>
                                            {os.veiculo?.placa || 'N/A'}
                                        </strong>

                                        {os.veiculo?.cliente?.nome
                                            ? ` | Cliente: ${os.veiculo.cliente.nome}`
                                            : ''}
                                    </span>
                                </div>
                            </div>

                            <div className="card-info">
                                <p>
                                    📅 Entrada:{' '}
                                    <strong>
                                        {formatarData(os.dataEntrada)}
                                    </strong>
                                </p>

                                <p>
                                    🏁 Previsão Entrega:{' '}
                                    <strong>
                                        {formatarData(os.previsaoEntrega)}
                                    </strong>
                                </p>

                                <p>
                                    👨‍🔧 Mecânico:{' '}
                                    <strong>
                                        {os.mecanResp?.nome ||
                                            'Não designado'}
                                    </strong>
                                </p>
                            </div>

                            <div
                                className="card-actions"
                                onClick={(e) =>
                                    e.stopPropagation()
                                }
                            >
                                <select
                                    className="form-input"
                                    style={{
                                        padding: '6px 10px',
                                        fontSize: '0.85rem'
                                    }}
                                    value={
                                        os.prioridade || 'NORMAL'
                                    }
                                    disabled={
                                        os.statusOperac === 'FINALIZADA' ||
                                        os.statusOperac === 'AGUARDANDO_APROVACAO'
                                    }
                                    onChange={(e) =>
                                        handleAlterarPrioridade(
                                            os.id,
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="NORMAL">
                                        Prioridade: Normal
                                    </option>

                                    <option value="ALTA">
                                        Prioridade: Alta
                                    </option>

                                    <option value="URGENTE">
                                        Prioridade: Urgente
                                    </option>
                                </select>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* MODAL DE DETALHES DA OS + RF09 */}
            {osDetalhe && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content gf-os-modal">
                        <div className="modal-header">
                            <div>
                                <span className="gf-os-eyebrow">
                                    GESTÃO DE ORDENS DE SERVIÇO
                                </span>

                                <h2 style={{
                                    color: 'var(--gf-primary-dark)'
                                }}>
                                    Ordem de Serviço #{osDetalhe.id}
                                </h2>

                                <span className="gf-os-subtitle">
                                    Detalhes do atendimento e orçamento
                                </span>
                            </div>

                            <button
                                className="btn-close"
                                onClick={fecharDetalhesOS}
                                disabled={fechandoRascunho}
                            >
                                ×
                            </button>
                        </div>

                        <div className="gf-os-status-row">
                            <span className="gf-os-status">
                                <span className="gf-os-status-dot" />
                                {formatarStatus(
                                    osDetalhe.statusOperac
                                )}
                            </span>

                            <span
                                className="gf-os-priority"
                                style={estiloPrioridade(
                                    osDetalhe.prioridade
                                )}
                            >
                                Prioridade:{' '}
                                {osDetalhe.prioridade || 'NORMAL'}
                            </span>
                        </div>

                        <div className="gf-os-section">
                            <h3 className="gf-os-section-title">
                                Informações do atendimento
                            </h3>

                            <div className="gf-os-info-grid">
                                <div className="gf-os-info-item">
                                    <span>Veículo</span>
                                    <strong>
                                        {osDetalhe.veiculo
                                            ? `${osDetalhe.veiculo.marca} ${osDetalhe.veiculo.modelo}`
                                            : 'N/A'}
                                    </strong>
                                </div>

                                <div className="gf-os-info-item">
                                    <span>Placa</span>
                                    <strong>
                                        {osDetalhe.veiculo?.placa ||
                                            'N/A'}
                                    </strong>
                                </div>

                                <div className="gf-os-info-item">
                                    <span>Cliente proprietário</span>
                                    <strong>
                                        {osDetalhe.veiculo?.cliente?.nome ||
                                            'N/A'}
                                    </strong>
                                </div>

                                <div className="gf-os-info-item">
                                    <span>Mecânico responsável</span>
                                    <strong>
                                        {osDetalhe.mecanResp?.nome ||
                                            'Não atribuído'}
                                    </strong>
                                </div>

                                <div className="gf-os-info-item">
                                    <span>Data de entrada</span>
                                    <strong>
                                        {formatarData(
                                            osDetalhe.dataEntrada
                                        )}
                                    </strong>
                                </div>

                                <div className="gf-os-info-item">
                                    <span>Previsão de entrega</span>
                                    <strong>
                                        {formatarData(
                                            osDetalhe.previsaoEntrega
                                        )}
                                    </strong>
                                </div>

                                <div className="gf-os-info-item">
                                    <span>Status do pagamento</span>
                                    <strong>
                                        {osDetalhe.statusPag ||
                                            'Não informado'}
                                    </strong>
                                </div>
                            </div>

                            <div className="gf-os-diagnostico">
                                <span>
                                    Observações / Diagnóstico inicial
                                </span>

                                <p>
                                    {osDetalhe.obsDiag ||
                                        'Sem observações registradas.'}
                                </p>
                            </div>
                        </div>

                    {/* NOVO PAINEL DE ITENS (RF07) */}
                    <div className="gf-os-section">
                        <h3 className="gf-os-section-title">Itens e Serviços Aplicados</h3>
                        {/* Lista de itens atuais */}
                        {osDetalhe.itens && osDetalhe.itens.length > 0 ? (
                            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '15px' }}>
                                {osDetalhe.itens.map((item, index) => (
                                    <li key={index} style={{ padding: '8px', borderBottom: '1px solid #eee', fontSize: '0.85rem' }}>
                                        <span style={{ fontWeight: 'bold' }}>{item.quantidade}x</span> {item.descricao} - {formatarMoeda(item.subtotal)}
                                        {/* Se quiseres mostrar o valor unitário: {formatarMoeda(item.valorUnitario)} */}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '15px' }}>Nenhum item adicionado a esta OS ainda.</p>
                        )}


                        {/* Formulário de Adição (Apenas se não estiver bloqueada) */}
                        {podeFecharRascunho && (
                            <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                    <select
                                        className="form-input"
                                        value={novoItemTipo}
                                        onChange={(e) => {
                                            setNovoItemTipo(e.target.value);
                                            setNovoItemId('');
                                        }}
                                    >
                                        <option value="PECA">Adicionar Peça</option>
                                        <option value="SERVICO">Adicionar Serviço</option>
                                    </select>

                                    <select
                                        className="form-input"
                                        style={{ flex: 1 }}
                                        value={novoItemId}
                                        onChange={(e) => setNovoItemId(e.target.value)}
                                    >
                                        <option value="">Selecione...</option>
                                        {novoItemTipo === 'PECA'
                                            ? catalogoPecas.map(p => (
                                                <option key={p.id} value={p.id} disabled={p.qtdEstoque <= 0}>
                                                    {p.descricao} (qtd: {p.qtdEstoque}) - {formatarMoeda(p.valorUni)}
                                                </option>
                                            ))
                                            : catalogoServicos.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.descricao} - {formatarMoeda(s.valorUni)}
                                                </option>
                                            ))
                                        }
                                    </select>

                                    <input
                                        type="number"
                                        className="form-input"
                                        style={{ width: '80px' }}
                                        min="1"
                                        value={novoItemQtd}
                                        onChange={(e) => setNovoItemQtd(e.target.value)}
                                        disabled={novoItemTipo === 'SERVICO'} // Serviços costumam ser qtd 1
                                    />
                                </div>

                                <button
                                    className="btn-primary"
                                    style={{ width: '100%', padding: '10px' }}
                                    onClick={handleAdicionarItem}
                                    disabled={!novoItemId || adicionandoItem}
                                >
                                    {adicionandoItem ? 'A Adicionar...' : '+ Incluir no Orçamento'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* PAINEL FINANCEIRO RF09 AQUI... */}

                        {/* PAINEL FINANCEIRO RF09 */}
                        <div className="gf-orcamento">
                            <div className="gf-orcamento-header">
                                <div>
                                    <span className="gf-orcamento-eyebrow">
                                        RF09 · REVISÃO FINANCEIRA
                                    </span>

                                    <h3>Resumo do orçamento</h3>

                                    <p>
                                        Confira os valores antes de
                                        encaminhar para aprovação do cliente.
                                    </p>
                                </div>

                                <div className="gf-orcamento-icon">
                                    R$
                                </div>
                            </div>

                            <div className="gf-orcamento-resumo">
                                <div className="gf-orcamento-linha">
                                    <span>
                                        Subtotal de peças e serviços
                                    </span>

                                    <strong>
                                        {formatarMoeda(valorBruto)}
                                    </strong>
                                </div>

                                <div className="gf-orcamento-linha">
                                    <span>Desconto</span>

                                    <strong className="gf-orcamento-desconto">
                                        −{' '}
                                        {formatarMoeda(
                                            podeFecharRascunho
                                                ? descontoValido
                                                    ? descontoNumerico
                                                    : 0
                                                : osDetalhe.desconto
                                        )}
                                    </strong>
                                </div>

                                <div className="gf-orcamento-total">
                                    <div>
                                        <span>VALOR FINAL</span>

                                        <small>
                                            {podeFecharRascunho
                                                ? 'Atualizado em tempo real'
                                                : 'Valor do orçamento'}
                                        </small>
                                    </div>

                                    <strong>
                                        {formatarMoeda(
                                            podeFecharRascunho
                                                ? valorFinal
                                                : osDetalhe.valorFinal
                                        )}
                                    </strong>
                                </div>
                            </div>

                            {podeFecharRascunho && (
                                <div className="gf-orcamento-edicao">
                                    <label htmlFor="gf-desconto">
                                        Aplicar desconto
                                    </label>

                                    <p>
                                        Informe o desconto em reais.
                                        O valor final será recalculado
                                        automaticamente.
                                    </p>

                                    <div className="gf-desconto-input-wrapper">
                                        <span>R$</span>

                                        <input
                                            id="gf-desconto"
                                            type="number"
                                            min="0"
                                            max={valorBruto}
                                            step="0.01"
                                            value={desconto}
                                            disabled={fechandoRascunho}
                                            onChange={(e) => {
                                                setDesconto(
                                                    e.target.value
                                                );

                                                setErroFechamento('');
                                            }}
                                            placeholder="0.00"
                                        />
                                    </div>

                                    {!descontoValido && (
                                        <span className="gf-desconto-aviso">
                                            O desconto deve estar entre
                                            R$ 0,00 e{' '}
                                            {formatarMoeda(valorBruto)},
                                            com até duas casas decimais.
                                        </span>
                                    )}
                                </div>
                            )}

                            {erroFechamento && (
                                <div
                                    className="gf-orcamento-feedback gf-feedback-erro"
                                    role="alert"
                                >
                                    {erroFechamento}
                                </div>
                            )}

                            {sucessoFechamento && (
                                <div
                                    className="gf-orcamento-feedback gf-feedback-sucesso"
                                    role="status"
                                >
                                    {sucessoFechamento}
                                </div>
                            )}

                            {podeFecharRascunho ? (
                                <button
                                    type="button"
                                    className="gf-btn-fechar-orcamento"
                                    onClick={handleFecharRascunho}
                                    disabled={
                                        fechandoRascunho ||
                                        !descontoValido
                                    }
                                >
                                    {fechandoRascunho
                                        ? 'Fechando orçamento...'
                                        : '✓ Confirmar fechamento do orçamento'}
                                </button>
                            ) : (
                                <div className="gf-orcamento-bloqueado">
                                    {osDetalhe.statusOperac ===
                                    'AGUARDANDO_APROVACAO'
                                        ? '✓ Orçamento fechado. Aguardando aprovação do cliente.'
                                        : 'O fechamento do orçamento está disponível apenas para ordens em análise.'}
                                </div>
                            )}
                        </div>

                        <div className="gf-os-footer">
                            <button
                                type="button"
                                className="gf-btn-voltar"
                                onClick={fecharDetalhesOS}
                                disabled={fechandoRascunho}
                            >
                                Fechar detalhes
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* MODAL DE CRIACAO DE OS */}
            {isModalOpen && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 style={{
                                color: 'var(--gf-primary-dark)'
                            }}>
                                Abrir Nova Ordem de Serviço
                            </h2>

                            <button
                                className="btn-close"
                                onClick={() =>
                                    setIsModalOpen(false)
                                }
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">
                                    Veículo (Frota Cadastrada)
                                </label>

                                <select
                                    name="veiculoId"
                                    value={formData.veiculoId}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                >
                                    <option value="">
                                        Selecione um veículo...
                                    </option>

                                    {veiculos.map((v) => (
                                        <option
                                            key={v.id}
                                            value={v.id}
                                        >
                                            {v.placa} — {v.marca}{' '}
                                            {v.modelo}

                                            {v.cliente?.nome
                                                ? ` (Cliente: ${v.cliente.nome})`
                                                : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Mecânico Responsável
                                </label>

                                <select
                                    name="funcionarioId"
                                    value={formData.funcionarioId}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                >
                                    <option value="">
                                        Selecione o profissional responsável...
                                    </option>

                                    {funcionarios.map((f) => (
                                        <option
                                            key={f.id}
                                            value={f.id}
                                        >
                                            {f.nome} (
                                            {f.cargo || 'Mecânico'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Prioridade do Atendimento
                                </label>

                                <select
                                    name="prioridade"
                                    value={formData.prioridade}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                >
                                    <option value="NORMAL">
                                        Normal
                                    </option>

                                    <option value="ALTA">
                                        Alta
                                    </option>

                                    <option value="URGENTE">
                                        Urgente
                                    </option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Data de Entrada
                                </label>

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
                                <label className="form-label">
                                    Previsão de Entrega
                                </label>

                                <input
                                    type="date"
                                    name="previsaoEntrega"
                                    min={
                                        formData.dataEntrada || hoje
                                    }
                                    value={formData.previsaoEntrega}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Relato do Cliente / Diagnóstico Inicial
                                </label>

                                <textarea
                                    name="obsDiag"
                                    rows="3"
                                    placeholder="Ex: Cliente relata barulho na roda dianteira direita ao frear..."
                                    value={formData.obsDiag}
                                    onChange={handleChange}
                                    className="form-input"
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn-submit"
                            >
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
