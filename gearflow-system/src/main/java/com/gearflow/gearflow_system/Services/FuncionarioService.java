package com.gearflow.gearflow_system.Services;

import com.gearflow.gearflow_system.DTOs.FuncionarioDTO;
import com.gearflow.gearflow_system.Models.Funcionario;
import com.gearflow.gearflow_system.Models.NivelAcesso;
import com.gearflow.gearflow_system.Repositories.FuncionarioRepository;
import org.springframework.stereotype.Service;

@Service
public class FuncionarioService {

    private final FuncionarioRepository funcionarioRepository;

    public FuncionarioService(FuncionarioRepository funcionarioRepository) {
        this.funcionarioRepository = funcionarioRepository;
    }

    public Funcionario cadastrarMecanico(FuncionarioDTO dto) {
        Funcionario mecanico = new Funcionario();
        mecanico.setNome(dto.getNome());
        mecanico.setEmail(dto.getEmail());
        mecanico.setSenha(dto.getSenha());
        mecanico.setSenha(dto.getCpf());
        mecanico.setNivelAcesso(NivelAcesso.MECANICO);

        // Lógica de Matrícula Automática
        Funcionario ultimoFuncionario = funcionarioRepository.findTopByOrderByIdDesc();
        long proximoId = (ultimoFuncionario != null) ? ultimoFuncionario.getId() + 1 : 1;
        String matriculaGerada = String.format("%04d", proximoId);
        mecanico.setMatricula(matriculaGerada);

        return funcionarioRepository.save(mecanico);
    }
}
