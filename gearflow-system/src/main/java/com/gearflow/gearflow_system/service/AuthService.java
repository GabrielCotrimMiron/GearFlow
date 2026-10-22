package com.gearflow.gearflow_system.service;

import com.gearflow.gearflow_system.dto.LoginDTO;
import com.gearflow.gearflow_system.model.Usuario;
import com.gearflow.gearflow_system.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;

    // Injeção de dependência do repositório
    public AuthService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public boolean autenticarAdmin(LoginDTO login) {
        // 1. Busca o utilizador na base de dados pelo e-mail
        Optional<Usuario> usuarioEncontrado = usuarioRepository.findByEmail(login.getEmail());

        // 2. Se o e-mail existir, valida a senha usando o metodo da própria entidade Usuario
        if (usuarioEncontrado.isPresent()) {
            Usuario usuario = usuarioEncontrado.get();
            return usuario.autenticar(login.getSenha());
        }

        // 3. Se o e-mail não for encontrado, o login falha
        return false;
    }
}