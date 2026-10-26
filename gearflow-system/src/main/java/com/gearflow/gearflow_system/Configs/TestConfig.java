package com.gearflow.gearflow_system.Configs;

import com.gearflow.gearflow_system.Models.Funcionario;
import com.gearflow.gearflow_system.Models.NivelAcesso;
import com.gearflow.gearflow_system.Repositories.FuncionarioRepository;
import com.gearflow.gearflow_system.Repositories.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TestConfig {

    @Bean
    public CommandLineRunner instanciarAdmin(UsuarioRepository usuarioRepository, FuncionarioRepository funcionarioRepository) {
        return args -> {
            // Verifica se o admin já existe para não tentar criar um duplicado a cada Play
            if (usuarioRepository.findByEmail("admin@gearflow.com").isEmpty()) {

                Funcionario admin = new Funcionario();
                admin.setNome("Administrador");
                admin.setEmail("admin@gearflow.com");
                admin.setSenha("admin123");
                admin.setNivelAcesso(NivelAcesso.GERENTE);

                // O save no FuncionarioRepository preenche as tabelas 'usuario' e 'funcionario' automaticamente
                funcionarioRepository.save(admin);

                System.out.println("Usuário Admin padrão criado com sucesso!");
            }
        };
    }
}