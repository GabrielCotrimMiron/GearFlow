package com.gearflow.gearflow_system.Services;

import com.gearflow.gearflow_system.DTOs.FuncionarioDTO;
import com.gearflow.gearflow_system.Models.Funcionario;
import com.gearflow.gearflow_system.Models.NivelAcesso;
import com.gearflow.gearflow_system.Repositories.FuncionarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.gearflow.gearflow_system.Repositories.UsuarioRepository;
import java.util.Locale;

@Service
public class FuncionarioService {

    private final FuncionarioRepository funcionarioRepository;
    private final UsuarioRepository usuarioRepository;

    public FuncionarioService(FuncionarioRepository funcionarioRepository, UsuarioRepository usuarioRepository) {
        this.funcionarioRepository = funcionarioRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public Funcionario cadastrarMecanico(FuncionarioDTO dto) {
        if (dto == null || dto.getNome() == null || dto.getNome().isBlank()
                || dto.getEmail() == null || dto.getEmail().isBlank()
                || dto.getSenha() == null || dto.getSenha().isBlank()
                || dto.getCpf() == null || dto.getCpf().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Nome, e-mail, CPF e senha são obrigatórios.");
        }
        String email = dto.getEmail().trim().toLowerCase(Locale.ROOT);
        if (usuarioRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado.");
        }
        Funcionario mecanico = new Funcionario();
        mecanico.setNome(dto.getNome().trim());
        mecanico.setEmail(email);
        mecanico.setSenha(dto.getSenha());
        mecanico.setCpf(dto.getCpf());
        mecanico.setNivelAcesso(dto.getNivelAcesso() == null ? NivelAcesso.MECANICO : dto.getNivelAcesso());

        // Usa o ID realmente gerado pelo banco para evitar matrícula duplicada.
        Funcionario salvo = funcionarioRepository.saveAndFlush(mecanico);
        salvo.setMatricula(String.format("%04d", salvo.getId()));
        return funcionarioRepository.save(salvo);
    }
}
