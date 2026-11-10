package com.gearflow.gearflow_system.Controllers;

import com.gearflow.gearflow_system.DTOs.HistoricoManutencaoDTO;
import com.gearflow.gearflow_system.Models.Cliente;
import com.gearflow.gearflow_system.Models.Veiculo;
import com.gearflow.gearflow_system.Services.VeiculoService;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/veiculos")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class VeiculoController {

    private final VeiculoService veiculoService;

    public VeiculoController(VeiculoService veiculoService) {
        this.veiculoService = veiculoService;
    }

    @PutMapping("/{id}/cliente")
    public Veiculo vincularCliente(@PathVariable Integer id, @RequestBody Cliente cliente) {
        return veiculoService.vincularCliente(id, cliente);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Veiculo cadastrar(@RequestBody Veiculo veiculo) {
        return veiculoService.cadastrar(veiculo);
    }

    @GetMapping("/meus")
    public List<Veiculo> listarMeusVeiculos(Authentication authentication) {
        return veiculoService.listarVeiculosDoCliente(authentication);
    }

    @PostMapping("/meus")
    @ResponseStatus(HttpStatus.CREATED)
    public Veiculo cadastrarMeuVeiculo(
            @RequestBody Veiculo veiculo,
            Authentication authentication) {
        return veiculoService.cadastrarVeiculoDoCliente(veiculo, authentication);
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