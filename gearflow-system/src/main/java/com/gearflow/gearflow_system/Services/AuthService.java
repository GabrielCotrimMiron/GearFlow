package com.gearflow.gearflow_system.Services;

import com.gearflow.gearflow_system.DTOs.LoginDTO;
import com.gearflow.gearflow_system.DTOs.LoginResponseDTO;
import com.gearflow.gearflow_system.Models.Funcionario;
import com.gearflow.gearflow_system.Models.Usuario;
import com.gearflow.gearflow_system.Repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    public LoginResponseDTO autenticar(LoginDTO login) {
        if (login == null || login.getEmail() == null || login.getSenha() == null) {
            throw new BadCredentialsException("Email ou senha inválidos.");
        }
        // Busca o usuário pelo e-mail
        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(login.getEmail() == null ? "" : login.getEmail().trim())
                .orElseThrow(() -> new BadCredentialsException("Email ou senha inválidos."));

        // Verifica a senha (simplificado; idealmente usar BCrypt)
        if (usuario.getSenha() == null || !usuario.getSenha().equals(login.getSenha())) {
            throw new BadCredentialsException("Email ou senha inválidos.");
        }

        // Define o tipo de Dashboard
        String user = "CLIENTE"; // Padrão se for instância de Cliente

        if (usuario instanceof Funcionario func) {
            user = func.getNivelAcesso() == null ? "MECANICO" : func.getNivelAcesso().name(); // Retorna "GERENTE" ou "MECANICO"
        }

        return new LoginResponseDTO(usuario.getId(), usuario.getNome(), user, usuario.getEmail());
    }
}