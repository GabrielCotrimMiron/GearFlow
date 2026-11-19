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
            // Admin de demonstração é opcional e exclusivo do ambiente local.
            // Ex.: GEARFLOW_DEMO_ADMIN_PASSWORD=uma-senha-de-teste
            String senhaDemo = System.getenv("GEARFLOW_DEMO_ADMIN_PASSWORD");
            if (senhaDemo == null || senhaDemo.isBlank()) return;
            if (usuarioRepository.findByEmail("admin@gearflow.com").isEmpty()) {

                Funcionario admin = new Funcionario();
                admin.setNome("Administrador");
                admin.setEmail("admin@gearflow.com");
                admin.setSenha(senhaDemo);
                admin.setNivelAcesso(NivelAcesso.GERENTE);

                // O save no FuncionarioRepository preenche as tabelas 'usuario' e 'funcionario' automaticamente
                funcionarioRepository.save(admin);

                System.out.println("Administrador de demonstração criado no banco local.");
            }
        };
    }
}