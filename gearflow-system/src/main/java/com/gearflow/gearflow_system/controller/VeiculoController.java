
package com.gearflow.gearflow_system.controller;

import com.gearflow.gearflow_system.model.Veiculo;
import com.gearflow.gearflow_system.service.VeiculoService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.gearflow.gearflow_system.dto.HistoricoManutencaoDTO;

@RestController
@RequestMapping("/veiculos")
public class VeiculoController {

    private final VeiculoService veiculoService;

    public VeiculoController(VeiculoService veiculoService) {
        this.veiculoService = veiculoService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Veiculo cadastrar(@RequestBody Veiculo veiculo) {
        return veiculoService.cadastrar(veiculo);
    }

    @GetMapping
    public List<Veiculo> listarTodos() {
        return veiculoService.listarTodos();
    }

    @GetMapping("/{id}")
    public Veiculo buscarPorId(@PathVariable Integer id) {
        return veiculoService.buscarPorId(id);
    }

    @GetMapping("/{id}/historico")
    public List<HistoricoManutencaoDTO> buscarHistorico(
            @PathVariable Integer id) {

        return veiculoService.buscarHistorico(id);
    }
}
