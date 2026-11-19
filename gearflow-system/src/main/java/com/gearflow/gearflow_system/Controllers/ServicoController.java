package com.gearflow.gearflow_system.Controllers;

import com.gearflow.gearflow_system.Models.Servico;
import com.gearflow.gearflow_system.Repositories.ServicoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/servicos")
public class ServicoController {

    private final ServicoRepository servicoRepository;

    public ServicoController(ServicoRepository servicoRepository) {
        this.servicoRepository = servicoRepository;
    }

    @GetMapping
    public List<Servico> listarTodos() {
        return servicoRepository.buscarCatalogo();
    }

    @PostMapping
    public ResponseEntity<Servico> cadastrarServico(@RequestBody Servico novoServico) {
        // No catálogo de mão de obra, a quantidade padrão de referência é 1
        if (novoServico.getQtd() == null) {
            novoServico.setQtd(1);
        }
        return ResponseEntity.ok(servicoRepository.save(novoServico));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Servico> atualizarServico(
            @PathVariable("id") Integer id,
            @RequestBody Servico dados) {

        return servicoRepository.findById(id)
                .map(servico -> {
                    servico.setDescricao(dados.getDescricao());
                    servico.setCategoria(dados.getCategoria());
                    servico.setTempoEstim(dados.getTempoEstim());
                    servico.setValorUni(dados.getValorUni());
                    return ResponseEntity.ok(servicoRepository.save(servico));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/desconto")
    public ResponseEntity<Servico> aplicarDescontoServico(
            @PathVariable("id") Integer id,
            @RequestParam("porcentagem") double porcentagem) {

        return servicoRepository.findById(id)
                .map(servico -> {
                    try {
                        servico.aplicarDesconto(porcentagem);
                    } catch (IllegalArgumentException ex) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
                    }
                    return ResponseEntity.ok(servicoRepository.save(servico));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluirServico(@PathVariable("id") Integer id) {
        if (servicoRepository.existsById(id)) {
            servicoRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}