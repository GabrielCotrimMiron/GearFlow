package com.gearflow.gearflow_system.Controllers;

import com.gearflow.gearflow_system.DTOs.FuncionarioDTO;
import com.gearflow.gearflow_system.Models.Funcionario;
import com.gearflow.gearflow_system.Repositories.FuncionarioRepository;
import com.gearflow.gearflow_system.Services.FuncionarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/funcionarios")
public class FuncionarioController {

    private final FuncionarioService funcionarioService;
    private final FuncionarioRepository funcionarioRepository;

    public FuncionarioController(FuncionarioService funcionarioService, FuncionarioRepository funcionarioRepository) {
        this.funcionarioService = funcionarioService;
        this.funcionarioRepository = funcionarioRepository;
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public String emailDuplicadoOuVinculo() {
        return "Cadastro duplicado ou funcionário associado a outros registros.";
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Funcionario cadastrarMecanico(@RequestBody FuncionarioDTO dto) {
        return funcionarioService.cadastrarMecanico(dto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Funcionario> atualizarFuncionario(@PathVariable Integer id, @RequestBody Funcionario dadosAtualizados) {
        return funcionarioRepository.findById(id)
                .map(funcionarioExistente -> {
                    // Atualiza os dados permitidos
                    funcionarioExistente.setNome(dadosAtualizados.getNome());
                    funcionarioExistente.setEmail(dadosAtualizados.getEmail());
                    funcionarioExistente.setCpf(dadosAtualizados.getCpf());
                    funcionarioExistente.setMatricula(dadosAtualizados.getMatricula());
                    if (dadosAtualizados.getNivelAcesso() != null) {
                        funcionarioExistente.setNivelAcesso(dadosAtualizados.getNivelAcesso());
                    }
                    // A senha só muda quando preenchida no formulário.
                    if (dadosAtualizados.getSenha() != null && !dadosAtualizados.getSenha().isBlank()) {
                        funcionarioExistente.setSenha(dadosAtualizados.getSenha());
                    }

                    Funcionario funcionarioSalvo = funcionarioRepository.save(funcionarioExistente);
                    return ResponseEntity.ok(funcionarioSalvo);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Object> excluirMecanico(@PathVariable("id") Integer id) {
        if (funcionarioRepository.existsById(id)) {
            funcionarioRepository.deleteById(id);
            return ResponseEntity.noContent().build(); // Status 204 (Sucesso, sem conteúdo)
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping
    public List<Funcionario> listarTodos() {
        return funcionarioRepository.findAll();
    }
}