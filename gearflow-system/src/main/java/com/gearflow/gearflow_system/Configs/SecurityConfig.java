
package com.gearflow.gearflow_system.Configs;

import com.gearflow.gearflow_system.Models.Cliente;
import com.gearflow.gearflow_system.Models.Funcionario;
import com.gearflow.gearflow_system.Models.NivelAcesso;
import com.gearflow.gearflow_system.Repositories.UsuarioRepository;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;

@Configuration
public class SecurityConfig {
        @Bean
        public SecurityContextRepository securityContextRepository() {
                return new HttpSessionSecurityContextRepository();
        }

        @Bean
        public SecurityFilterChain securityFilterChain(
                        HttpSecurity http,
                        SecurityContextRepository securityContextRepository) throws Exception {

                return http
                                .securityContext(context -> context
                                                .securityContextRepository(securityContextRepository))
                                .cors(Customizer.withDefaults())
                                .csrf(csrf -> csrf.disable())
                                .authorizeHttpRequests(auth -> auth
                                                // Acesso publico necessário para entrar e se cadastrar.
                                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                                                .requestMatchers("/error").permitAll()
                                                .requestMatchers(HttpMethod.POST, "/auth/login", "/clientes/registro").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/auth/session",
                                                                "/agendamentos/horarios-disponiveis").permitAll()
                                                .requestMatchers(HttpMethod.POST, "/auth/logout").permitAll()

                                                // Cadastros de clientes e equipe sao gerenciados pelo gerente.
                                                .requestMatchers("/admin/clientes", "/admin/clientes/**")
                                                .hasRole("GERENTE")
                                                .requestMatchers(HttpMethod.PUT, "/clientes/*").hasRole("GERENTE")
                                                .requestMatchers(HttpMethod.GET, "/funcionarios").hasRole("FUNCIONARIO")
                                                .requestMatchers("/funcionarios", "/funcionarios/**").hasRole("GERENTE")

                                                // Um cliente visualiza e cadastra apenas os próprios veículos.
                                                .requestMatchers(HttpMethod.GET, "/veiculos/meus").hasRole("USER")
                                                .requestMatchers(HttpMethod.POST, "/veiculos/meus").hasRole("USER")
                                                .requestMatchers(HttpMethod.GET, "/veiculos/*/historico").authenticated()
                                                .requestMatchers("/veiculos", "/veiculos/**").hasRole("FUNCIONARIO")

                                                // Agendamento de cliente, e gerenciamento pela oficina.
                                                .requestMatchers("/agendamentos/meus").hasRole("USER")
                                                .requestMatchers("/agendamentos", "/agendamentos/**")
                                                .hasRole("FUNCIONARIO")
                                                .requestMatchers("/alertas-preventivos", "/alertas-preventivos/**")
                                                .hasRole("USER")

                                                // Consultas e aprovacao de orcamentos pelo cliente.
                                                .requestMatchers(HttpMethod.GET, "/ordens-servico/minhas",
                                                                "/ordens-servico/*/acompanhamento",
                                                                "/ordens-servico/*/orcamento")
                                                .hasRole("USER")
                                                .requestMatchers(HttpMethod.PUT,
                                                                "/ordens-servico/*/aprovar",
                                                                "/ordens-servico/*/rejeitar")
                                                .hasRole("USER")
                                                // Inspecao: leitura para dono da OS ou funcionario;
                                                // escrita somente para funcionario (ver Inspecao3DService).
                                                .requestMatchers("/ordens-servico/*/inspecao3d",
                                                                "/ordens-servico/*/inspecao3d/**")
                                                .authenticated()

                                                // Rotinas operacionais internas.
                                                .requestMatchers("/ordens-servico", "/ordens-servico/**",
                                                                "/pecas", "/pecas/**", "/servicos", "/servicos/**",
                                                                "/financeiro", "/financeiro/**")
                                                .hasRole("FUNCIONARIO")
                                                .anyRequest().denyAll())
                                .httpBasic(Customizer.withDefaults())
                                .build();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration config = new CorsConfiguration();

                config.setAllowedOrigins(List.of(
                                "http://localhost:5173",
                                "http://localhost:5174",
                                "http://127.0.0.1:5173",
                                "http://127.0.0.1:5174"));

                config.setAllowedMethods(List.of(
                                "GET",
                                "POST",
                                "PUT",
                                "DELETE",
                                "OPTIONS"));

                config.setAllowedHeaders(List.of(
                                "Authorization",
                                "Content-Type",
                                "Accept",
                                "X-Client",
                                "X-XSRF-TOKEN"));
                config.setAllowCredentials(true);
                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

                source.registerCorsConfiguration("/**", config);

                return source;
        }

        @Bean
        public UserDetailsService userDetailsService(
                        UsuarioRepository usuarios) {

                return email -> {
                        var usuario = usuarios.findByEmailIgnoreCase(email)
                                        .orElseThrow(() -> new UsernameNotFoundException(
                                                        "Usuario nao encontrado"));

                        String[] perfis = usuario instanceof Cliente
                                        ? new String[] { "USER" }
                                        : usuario instanceof Funcionario funcionario
                                                        && funcionario.getNivelAcesso() == NivelAcesso.GERENTE
                                                                        ? new String[] { "FUNCIONARIO", "GERENTE" }
                                                                        : new String[] { "FUNCIONARIO" };

                        return User.withUsername(usuario.getEmail())
                                        .password(usuario.getSenha())
                                        .roles(perfis)
                                        .build();
                };
        }

        // Temporario para testes locais.
        @Bean
        @SuppressWarnings("deprecation")
        public PasswordEncoder passwordEncoder() {
                return NoOpPasswordEncoder.getInstance();
        }
}
