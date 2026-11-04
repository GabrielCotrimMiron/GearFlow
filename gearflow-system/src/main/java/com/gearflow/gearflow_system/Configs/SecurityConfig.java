
package com.gearflow.gearflow_system.Configs;

import com.gearflow.gearflow_system.Models.Cliente;
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

@Configuration
public class SecurityConfig {

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http)
                        throws Exception {

                return http
                                .cors(Customizer.withDefaults())
                                .csrf(csrf -> csrf.disable())
                                .authorizeHttpRequests(auth -> auth

                                                // RF05 - Somente funcionarios
                                                .requestMatchers(
                                                                HttpMethod.GET,
                                                                "/ordens-servico/fila-prioridade")
                                                .hasRole("FUNCIONARIO")

                                                // RF05 - Somente funcionarios podem alterar prioridades
                                                .requestMatchers(
                                                                HttpMethod.PUT,
                                                                "/ordens-servico/*/prioridade")
                                                .hasRole("FUNCIONARIO")

                                                // RF12 e RF13 - Cliente autenticado
                                                .requestMatchers(
                                                                HttpMethod.GET,
                                                                "/ordens-servico/minhas",
                                                                "/ordens-servico/*/acompanhamento",
                                                                "/ordens-servico/*/orcamento")
                                                .authenticated()

                                                .anyRequest().permitAll())
                                .httpBasic(Customizer.withDefaults())
                                .build();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration config = new CorsConfiguration();

                config.setAllowedOrigins(
                                List.of("http://localhost:5173"));

                config.setAllowedMethods(
                                List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

                config.setAllowedHeaders(
                                List.of("Authorization", "Content-Type", "Accept"));

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

                        // Cliente continua com o perfil USER
                        String perfil = usuario instanceof Cliente
                                        ? "USER"
                                        : "FUNCIONARIO";

                        return User.withUsername(usuario.getEmail())
                                        .password(usuario.getSenha())
                                        .roles(perfil)
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
