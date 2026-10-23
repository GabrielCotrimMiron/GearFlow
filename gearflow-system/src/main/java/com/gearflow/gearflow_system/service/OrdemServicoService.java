
package com.gearflow.gearflow_system.service;

import com.gearflow.gearflow_system.dto.AcompanhamentoDTO;
import com.gearflow.gearflow_system.model.OrdemServico;
import com.gearflow.gearflow_system.model.Cliente;
import com.gearflow.gearflow_system.repository.OrdemServicoRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OrdemServicoService {

    private final OrdemServicoRepository ordemServicoRepository;

    public OrdemServicoService(OrdemServicoRepository ordemServicoRepository) {
        this.ordemServicoRepository = ordemServicoRepository;
    }

    @Transactional(readOnly = true)
    public AcompanhamentoDTO buscarAcompanhamento(
            Integer id, Authentication authentication) {

        OrdemServico ordem = ordemServicoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Ordem de servico nao encontrada"
                ));

        if (ordem.getVeiculo() == null ||
                ordem.getVeiculo().getCliente() == null) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Ordem de servico sem cliente vinculado"
            );
        }

        Cliente cliente = ordem.getVeiculo().getCliente();

        if (!cliente.getEmail().equalsIgnoreCase(authentication.getName())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Voce nao tem permissao para consultar esta ordem"
            );
        }

        return new AcompanhamentoDTO(ordem);
    }
}
