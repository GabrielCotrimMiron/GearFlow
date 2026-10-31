package com.gearflow.gearflow_system.Controllers;

import com.gearflow.gearflow_system.Models.Peca;
import com.gearflow.gearflow_system.Repositories.PecaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/pecas")
@CrossOrigin(origins = "*")
public class PecaController {
    private final PecaRepository pecaRepository;

    public PecaController(PecaRepository pecaRepository) {
        this.pecaRepository = pecaRepository;
    }

    @GetMapping
    public List<Peca> listarTodas() {
        return pecaRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Peca> cadastrarPeca(@RequestBody Peca novaPeca) {
        if (novaPeca.getQtdEstoque() == null) {
            novaPeca.setQtdEstoque(0);
        }
        if (novaPeca.getQtd() == null) {
            novaPeca.setQtd(0);
        }
        return ResponseEntity.ok(pecaRepository.save(novaPeca));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Peca> atualizarPeca(
            @PathVariable("id") Integer id,
            @RequestBody Peca dados) {

        return pecaRepository.findById(id)
                .map(peca -> {
                    peca.setDescricao(dados.getDescricao());
                    peca.setCodFabri(dados.getCodFabri());
                    peca.setValorUni(dados.getValorUni());
                    peca.setQtdEstoque(dados.getQtdEstoque()); // <-- Corrigido para qtdEstoque!
                    return ResponseEntity.ok(pecaRepository.save(peca));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluirPeca(@PathVariable("id") Integer id) {
        if (pecaRepository.existsById(id)) {
            pecaRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
