
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

                                                // Mantenha aqui todas as regras existentes

                                                // Permitir preflight CORS
                                                .requestMatchers(HttpMethod.OPTIONS, "/**")
                                                .permitAll()

                                                // Apenas gerentes podem gerenciar cadastros de clientes
                                                .requestMatchers("/admin/clientes/**")
                                                .hasRole("GERENTE")
                                                .requestMatchers(HttpMethod.PUT, "/clientes/*")
                                                .hasRole("GERENTE")

                                                // Listagem geral das ordens de servico
                                                // Acesso restrito aos funcionarios
                                                .requestMatchers(
                                                                HttpMethod.GET,
                                                                "/ordens-servico")
                                                .hasRole("FUNCIONARIO")

                                                // RF05 - Somente funcionarios
                                                .requestMatchers(
                                                                HttpMethod.GET,
                                                                "/ordens-servico/fila-prioridade")
                                                .hasRole("FUNCIONARIO")

                                                // RF05 - Alteracao de prioridades
                                                .requestMatchers(
                                                                HttpMethod.PUT,
                                                                "/ordens-servico/*/prioridade")
                                                .hasRole("FUNCIONARIO")

                                                // RF09 - Fechamento de rascunho
                                                .requestMatchers(
                                                                HttpMethod.PUT,
                                                                "/ordens-servico/*/fechar-rascunho")
                                                .hasRole("FUNCIONARIO")

                                                // RF12 e RF13 - Cliente autenticado
                                                .requestMatchers(
                                                                HttpMethod.GET,
                                                                "/ordens-servico/minhas",
                                                                "/ordens-servico/*/acompanhamento",
                                                                "/ordens-servico/*/orcamento")
                                                .authenticated()

                                                // RF14 - Aprovacao ou rejeicao de orcamento
                                                // Somente clientes autenticados
                                                .requestMatchers(
                                                                HttpMethod.PUT,
                                                                "/ordens-servico/*/aprovar",
                                                                "/ordens-servico/*/rejeitar")
                                                .hasRole("USER")

                                                // RF04 - Dashboard Financeira
                                                // Acesso restrito aos funcionarios autenticados
                                                .requestMatchers(
                                                                "/financeiro/**")
                                                .hasRole("FUNCIONARIO")

                                                .anyRequest().permitAll())
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
                                "Accept"));
                config.setAllowCredentials(true);
                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

                source.registerCorsConfiguration("/**", config);

                return source;
        }

        @Bean
        public UserDetailsService userDetailsService(
                        UsuarioRepository usuarios) {

                return email -> {
                        var usuario = usuarios.findByEmail(email)
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
