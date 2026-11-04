
package com.gearflow.gearflow_system.Services;

import com.gearflow.gearflow_system.DTOs.AcompanhamentoDTO;
import com.gearflow.gearflow_system.DTOs.OrcamentoDTO;
import com.gearflow.gearflow_system.Models.OrdemServico;
import com.gearflow.gearflow_system.Models.Cliente;
import com.gearflow.gearflow_system.Repositories.OrdemServicoRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import com.gearflow.gearflow_system.DTOs.OrdemServicoResumoDTO;

@Service
public class OrdemServicoService {

    private final OrdemServicoRepository ordemServicoRepository;

    public OrdemServicoService(OrdemServicoRepository ordemServicoRepository) {
        this.ordemServicoRepository = ordemServicoRepository;
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
