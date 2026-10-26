
package com.gearflow.gearflow_system.controller;

import com.gearflow.gearflow_system.dto.AcompanhamentoDTO;
import com.gearflow.gearflow_system.service.OrdemServicoService;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ordens-servico")
public class OrdemServicoController {

    private final OrdemServicoService ordemServicoService;

    public OrdemServicoController(OrdemServicoService ordemServicoService) {
        this.ordemServicoService = ordemServicoService;
    }

    @GetMapping("/{id}/acompanhamento")
    public AcompanhamentoDTO buscarAcompanhamento(
            @PathVariable Integer id,
            Authentication authentication) {

        return ordemServicoService.buscarAcompanhamento(id, authentication);
    }
}
