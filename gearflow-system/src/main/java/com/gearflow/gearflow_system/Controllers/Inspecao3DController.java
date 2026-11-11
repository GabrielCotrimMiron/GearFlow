package com.gearflow.gearflow_system.Controllers;

import com.gearflow.gearflow_system.DTOs.Inspecao3DDTO;
import com.gearflow.gearflow_system.Services.Inspecao3DService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ordens-servico/{ordemId}/inspecao3d")
public class Inspecao3DController {
    private final Inspecao3DService servico;
    public Inspecao3DController(Inspecao3DService servico) { this.servico = servico; }

    @GetMapping
    public Inspecao3DDTO.Resultado consultar(@PathVariable Integer ordemId, Authentication auth) {
        return servico.consultar(ordemId, auth);
    }

    @PostMapping("/anotacoes")
    @ResponseStatus(HttpStatus.CREATED)
    public Inspecao3DDTO.Anotacao registrar(@PathVariable Integer ordemId,
            @RequestBody Inspecao3DDTO.Criar dados, Authentication auth) {
        return servico.registrar(ordemId, dados, auth);
    }

    @PatchMapping("/anotacoes/{anotacaoId}")
    public Inspecao3DDTO.Anotacao atualizar(@PathVariable Integer ordemId,
            @PathVariable Long anotacaoId, @RequestBody Inspecao3DDTO.Atualizar dados, Authentication auth) {
        return servico.atualizar(ordemId, anotacaoId, dados, auth);
    }
}
