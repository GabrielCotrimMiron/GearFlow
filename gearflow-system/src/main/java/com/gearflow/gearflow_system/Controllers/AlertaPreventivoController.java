package com.gearflow.gearflow_system.Controllers;

import com.gearflow.gearflow_system.DTOs.AlertaPreventivoDTO;
import com.gearflow.gearflow_system.DTOs.CriarManutencaoPreventivaDTO;
import com.gearflow.gearflow_system.Services.AlertaPreventivoService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/alertas-preventivos")
public class AlertaPreventivoController {
    private final AlertaPreventivoService service;

    public AlertaPreventivoController(AlertaPreventivoService service) {
        this.service = service;
    }

    @GetMapping("/meus")
    public List<AlertaPreventivoDTO> meus(Authentication auth) {
        return service.meusAlertas(auth);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AlertaPreventivoDTO cadastrar(@RequestBody CriarManutencaoPreventivaDTO dto, Authentication auth) {
        return service.cadastrar(dto, auth);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void desativar(@PathVariable Integer id, Authentication auth) {
        service.desativar(id, auth);
    }
}
