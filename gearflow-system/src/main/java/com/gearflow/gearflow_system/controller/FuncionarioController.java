package com.gearflow.gearflow_system.controller;

import com.gearflow.gearflow_system.dto.FuncionarioDTO;
import com.gearflow.gearflow_system.model.Funcionario;
import com.gearflow.gearflow_system.service.FuncionarioService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/funcionarios")
@CrossOrigin(origins = "http://localhost:5173")
public class FuncionarioController {

    private final FuncionarioService funcionarioService;

    public FuncionarioController(FuncionarioService funcionarioService) {
        this.funcionarioService = funcionarioService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Funcionario cadastrarMecanico(@RequestBody FuncionarioDTO dto) {
        return funcionarioService.cadastrarMecanico(dto);
    }
}