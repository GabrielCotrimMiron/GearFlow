
package com.gearflow.gearflow_system.Services;

import com.gearflow.gearflow_system.DTOs.AcompanhamentoDTO;
import com.gearflow.gearflow_system.DTOs.FilaPrioridadeDTO;
import com.gearflow.gearflow_system.DTOs.OrcamentoDTO;
import com.gearflow.gearflow_system.DTOs.OrdemServicoResumoDTO;

import com.gearflow.gearflow_system.Models.Cliente;
import com.gearflow.gearflow_system.Models.OrdemServico;
import com.gearflow.gearflow_system.Models.PrioridadeOS;
import com.gearflow.gearflow_system.Repositories.OrdemServicoRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class OrdemServicoService {

    private final OrdemServicoRepository ordemServicoRepository;

    public OrdemServicoService(OrdemServicoRepository ordemServicoRepository) {
        this.ordemServicoRepository = ordemServicoRepository;
    }

    // RF05 - Fila de prioridade das ordens de servico
    @Transactional(readOnly = true)
    public List<FilaPrioridadeDTO> listarFilaPrioridade() {

        return ordemServicoRepository.listarFilaPrioridade()
                .stream()
                .map(FilaPrioridadeDTO::new)
                .toList();
    }

    // RF05 - Alterar prioridade de uma ordem de servico
    @Transactional
    public void alterarPrioridade(Integer id, PrioridadeOS prioridade) {

        if (prioridade == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A prioridade deve ser informada");
        }

        OrdemServico ordem = ordemServicoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Ordem de servico nao encontrada"));

        if (ordem.getStatusOperac() ==
                com.gearflow.gearflow_system.Models.StatusOperacional.FINALIZADA) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Nao e permitido alterar a prioridade de uma OS finalizada");
        }

        ordem.setPrioridade(prioridade);

        ordemServicoRepository.save(ordem);
    }

    // RF12 - Acompanhamento da Ordem de Servico
    @Transactional(readOnly = true)
    public AcompanhamentoDTO buscarAcompanhamento(
            Integer id, Authentication authentication) {

        OrdemServico ordem = buscarOrdemDoCliente(id, authentication);

        return new AcompanhamentoDTO(ordem);
    }

    // RF13 - Visualizacao do Orcamento
    @Transactional(readOnly = true)
    public OrcamentoDTO buscarOrcamento(
            Integer id, Authentication authentication) {

        OrdemServico ordem = buscarOrdemDoCliente(id, authentication);

        return new OrcamentoDTO(ordem);
    }

    @Transactional(readOnly = true)
    public List<OrdemServicoResumoDTO> listarOrdensDoCliente(
            Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
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
                !cliente.getEmail().equalsIgnoreCase(authentication.getName())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Voce nao tem permissao para consultar esta ordem");
        }

        return ordem;
    }
}
