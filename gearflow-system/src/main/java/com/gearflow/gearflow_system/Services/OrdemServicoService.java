
package com.gearflow.gearflow_system.Services;

import com.gearflow.gearflow_system.DTOs.AcompanhamentoDTO;
import com.gearflow.gearflow_system.DTOs.OrcamentoDTO;
import com.gearflow.gearflow_system.DTOs.OrdemServicoResumoDTO;
import com.gearflow.gearflow_system.DTOs.OrdemServicoGestaoDTO;

import com.gearflow.gearflow_system.Models.*;

import com.gearflow.gearflow_system.Repositories.OrdemServicoRepository;
import com.gearflow.gearflow_system.Repositories.VeiculoRepository;
import com.gearflow.gearflow_system.Repositories.FuncionarioRepository;
import com.gearflow.gearflow_system.Repositories.ItemOSRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.hibernate.Hibernate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class OrdemServicoService {

        private final ItemOSRepository itemOSRepository;
        private final OrdemServicoRepository ordemServicoRepository;
        private final VeiculoRepository veiculoRepository;
        private final FuncionarioRepository funcionarioRepository;

        public OrdemServicoService(
                        ItemOSRepository itemOSRepository, OrdemServicoRepository ordemServicoRepository,
                        VeiculoRepository veiculoRepository,
                        FuncionarioRepository funcionarioRepository) {
                this.itemOSRepository = itemOSRepository;

                this.ordemServicoRepository = ordemServicoRepository;
                this.veiculoRepository = veiculoRepository;
                this.funcionarioRepository = funcionarioRepository;
        }

        // Criar nova Ordem de Servico
        @Transactional
        public OrdemServico criarOrdemServico(
                        Integer veiculoId,
                        Integer funcionarioId,
                        LocalDate dataEntrada,
                        LocalDate previsaoEntrega,
                        PrioridadeOS prioridade,
                        String obsDiag) {

                if (veiculoId == null || funcionarioId == null) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Veiculo e funcionario sao obrigatorios");
                }

                if (dataEntrada == null || previsaoEntrega == null) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "As datas de entrada e entrega sao obrigatorias");
                }

                if (previsaoEntrega.isBefore(dataEntrada)) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "A previsao de entrega nao pode ser anterior a entrada");
                }

                Veiculo veiculo = veiculoRepository.findById(veiculoId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Veiculo nao encontrado"));

                Funcionario funcionario = funcionarioRepository.findById(funcionarioId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Funcionario nao encontrado"));

                OrdemServico ordem = new OrdemServico();

                ordem.setVeiculo(veiculo);
                ordem.setMecanResp(funcionario);
                ordem.setDataEntrada(dataEntrada);
                ordem.setPrevisaoEntrega(previsaoEntrega);
                ordem.setPrioridade(
                                prioridade != null ? prioridade : PrioridadeOS.NORMAL);
                ordem.setObsDiag(obsDiag);

                ordem.setStatusOperac(StatusOperacional.EM_ANALISE);

                return ordemServicoRepository.save(ordem);
        }

        // RF05 - Alterar prioridade
        @Transactional
        public void alterarPrioridade(
                        Integer id, PrioridadeOS prioridade) {

                if (prioridade == null) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "A prioridade deve ser informada");
                }

                OrdemServico ordem = ordemServicoRepository.findById(id)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Ordem de servico nao encontrada"));

                if (ordem.getStatusOperac() == StatusOperacional.FINALIZADA) {
                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "Nao e permitido alterar a prioridade de uma OS finalizada");
                }

                ordem.setPrioridade(prioridade);
                ordemServicoRepository.save(ordem);
        }

        @Transactional
        public void adicionarItem(Integer osId, Integer itemId, Integer quantidade) {
                if (quantidade == null || quantidade <= 0) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "A quantidade deve ser maior que zero.");
                }

                OrdemServico ordem = ordemServicoRepository.findById(osId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Ordem de serviço não encontrada"));

                ItemOS itemProxy = itemOSRepository.findById(itemId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Item não encontrado no catálogo"));

                // Desmascara o proxy para identificar a subclasse real do catálogo
                ItemOS itemCatalogo = (ItemOS) Hibernate.unproxy(itemProxy);
                if (itemCatalogo.getOrdemServico() != null) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Este item já pertence a uma ordem de serviço e não pode ser utilizado como item do catálogo.");
                }

                // 1. Se for Peça: valida, abate o estoque no item do catálogo e salva
                if (itemCatalogo instanceof Peca pecaCatalogo) {
                        try {
                                pecaCatalogo.abaterEstoque(quantidade);
                        } catch (IllegalArgumentException e) {
                                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
                        }
                        itemOSRepository.save(pecaCatalogo);

                        // Verifica se já existe essa peça nesta OS para somar a quantidade
                        Peca pecaExistenteNaOS = ordem.getItens().stream()
                                        .map(i -> (ItemOS) Hibernate.unproxy(i))
                                        .filter(Peca.class::isInstance)
                                        .map(Peca.class::cast)
                                        .filter(p -> p.getDescricao() != null
                                                        && p.getDescricao()
                                                                        .equalsIgnoreCase(pecaCatalogo.getDescricao()))
                                        .findFirst()
                                        .orElse(null);

                        if (pecaExistenteNaOS != null) {
                                int qtdAtual = pecaExistenteNaOS.getQtd() != null ? pecaExistenteNaOS.getQtd() : 0;
                                pecaExistenteNaOS.setQtd(qtdAtual + quantidade);
                                itemOSRepository.save(pecaExistenteNaOS);
                        } else {
                                // Cria um clone independente para vincular à OS
                                Peca novaPecaOS = new Peca();
                                novaPecaOS.setDescricao(pecaCatalogo.getDescricao());
                                novaPecaOS.setValorUni(pecaCatalogo.getValorUni());
                                novaPecaOS.setCodFabri(pecaCatalogo.getCodFabri());
                                novaPecaOS.setQtdEstoque(0);
                                novaPecaOS.setQtd(quantidade);

                                ordem.adicionarItem(novaPecaOS);
                                itemOSRepository.save(novaPecaOS);
                        }

                } else if (itemCatalogo instanceof Servico servicoCatalogo) {
                        // 2. Se for Serviço: verifica se já existe nesta OS ou cria um clone
                        Servico servicoExistenteNaOS = ordem.getItens().stream()
                                        .map(i -> (ItemOS) Hibernate.unproxy(i))
                                        .filter(Servico.class::isInstance)
                                        .map(Servico.class::cast)
                                        .filter(s -> s.getDescricao() != null
                                                        && s.getDescricao().equalsIgnoreCase(
                                                                        servicoCatalogo.getDescricao()))
                                        .findFirst()
                                        .orElse(null);

                        if (servicoExistenteNaOS != null) {
                                int qtdAtual = servicoExistenteNaOS.getQtd() != null ? servicoExistenteNaOS.getQtd()
                                                : 0;
                                servicoExistenteNaOS.setQtd(qtdAtual + quantidade);
                                itemOSRepository.save(servicoExistenteNaOS);
                        } else {
                                Servico novoServicoOS = new Servico();
                                novoServicoOS.setDescricao(servicoCatalogo.getDescricao());
                                novoServicoOS.setValorUni(servicoCatalogo.getValorUni());
                                novoServicoOS.setTempoEstim(servicoCatalogo.getTempoEstim());
                                novoServicoOS.setCategoria(servicoCatalogo.getCategoria());
                                novoServicoOS.setQtd(quantidade);

                                ordem.adicionarItem(novoServicoOS);
                                itemOSRepository.save(novoServicoOS);
                        }
                }

                ordemServicoRepository.save(ordem);
        }

        // RF12 - Acompanhamento da OS
        @Transactional(readOnly = true)
        public AcompanhamentoDTO buscarAcompanhamento(
                        Integer id, Authentication authentication) {

                OrdemServico ordem = buscarOrdemDoCliente(id, authentication);

                return new AcompanhamentoDTO(ordem);
        }

        // RF13 - Visualizacao do orcamento
        @Transactional(readOnly = true)
        public OrcamentoDTO buscarOrcamento(
                        Integer id, Authentication authentication) {

                OrdemServico ordem = buscarOrdemDoCliente(id, authentication);

                return new OrcamentoDTO(ordem);
        }

        @Transactional(readOnly = true)
        public List<OrdemServicoResumoDTO> listarOrdensDoCliente(
                        Authentication authentication) {

                if (authentication == null ||
                                !authentication.isAuthenticated()) {
                        throw new ResponseStatusException(
                                        HttpStatus.UNAUTHORIZED,
                                        "Cliente nao autenticado");
                }

                return ordemServicoRepository
                                .findByVeiculoClienteEmailIgnoreCaseOrderByDataEntradaDesc(
                                                authentication.getName())
                                .stream()
                                .map(OrdemServicoResumoDTO::new)
                                .toList();
        }

        // Validacao compartilhada entre RF12 e RF13
        private OrdemServico buscarOrdemDoCliente(
                        Integer id, Authentication authentication) {

                OrdemServico ordem = ordemServicoRepository.findById(id)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Ordem de servico nao encontrada"));

                if (ordem.getVeiculo() == null ||
                                ordem.getVeiculo().getCliente() == null) {
                        throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "Ordem de servico sem cliente vinculado");
                }

                Cliente cliente = ordem.getVeiculo().getCliente();

                if (authentication == null ||
                                !authentication.isAuthenticated() ||
                                !cliente.getEmail().equalsIgnoreCase(
                                                authentication.getName())) {

                        throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "Voce nao tem permissao para consultar esta ordem");
                }

                return ordem;
        }

        // RF09 - Fechamento de Rascunho
        @Transactional
        public void fecharRascunho(
                        Integer id, BigDecimal desconto) {

                OrdemServico ordem = ordemServicoRepository.findById(id)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Ordem de servico nao encontrada"));

                if (ordem.getStatusOperac() != StatusOperacional.EM_ANALISE) {
                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "A OS precisa estar em analise para fechar o rascunho");
                }

                if (ordem.getItens().isEmpty()) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Nao e possivel fechar um orcamento sem itens");
                }

                if (desconto == null) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "O desconto deve ser informado");
                }

                try {
                        ordem.aplicarDesconto(desconto);
                } catch (IllegalArgumentException e) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        e.getMessage());
                }

                ordem.avancarStatus(
                                StatusOperacional.AGUARDANDO_APROVACAO);

                ordemServicoRepository.save(ordem);
        }

        // Listar ordens para a tela de gestao
        @Transactional(readOnly = true)
        public List<OrdemServicoGestaoDTO> listarTodas() {

                return ordemServicoRepository.findAll()
                                .stream()
                                .map(OrdemServicoGestaoDTO::new)
                                .toList();
        }

        // RF14 - Aprovar orçamento
        @Transactional
        public void aprovarOrcamento(
                        Integer id, Authentication authentication) {

                OrdemServico ordem = buscarOrdemDoCliente(id, authentication);

                if (ordem.getStatusOperac() != StatusOperacional.AGUARDANDO_APROVACAO) {

                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "A OS precisa estar aguardando aprovacao");
                }

                ordem.aprovarOrcamento();
                ordemServicoRepository.save(ordem);
        }

        // RF14 - Rejeitar orçamento
        @Transactional
        public void rejeitarOrcamento(
                        Integer id, Authentication authentication) {

                OrdemServico ordem = buscarOrdemDoCliente(id, authentication);

                if (ordem.getStatusOperac() != StatusOperacional.AGUARDANDO_APROVACAO) {

                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "A OS precisa estar aguardando aprovacao");
                }

                ordem.rejeitarOrcamento();
                ordemServicoRepository.save(ordem);
        }

}
