
package com.gearflow.gearflow_system.Controllers;

import com.gearflow.gearflow_system.Models.Veiculo;
import com.gearflow.gearflow_system.Services.VeiculoService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.gearflow.gearflow_system.DTOs.HistoricoManutencaoDTO;

@RestController
@RequestMapping("/veiculos")
@CrossOrigin(origins = "http://localhost:5173")
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
