package com.gearflow.gearflow_system.Services;

import com.gearflow.gearflow_system.DTOs.LoginDTO;
import com.gearflow.gearflow_system.Models.Usuario;
import com.gearflow.gearflow_system.Repositories.UsuarioRepository;
import org.springframework.stereotype.Service;
import java.util.Optional;
import com.gearflow.gearflow_system.Models.Funcionario;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;

    // Injeção de dependência do repositório
    public AuthService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public boolean autenticarAdmin(LoginDTO login) {
        Optional<Usuario> usuarioEncontrado = usuarioRepository.findByEmail(login.getEmail());

        if (usuarioEncontrado.isPresent()) {
            Usuario usuario = usuarioEncontrado.get();

            return usuario instanceof Funcionario
                    && usuario.autenticar(login.getSenha());
        }

        return false;
    }
}