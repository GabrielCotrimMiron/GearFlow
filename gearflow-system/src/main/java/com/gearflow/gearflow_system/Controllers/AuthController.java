package com.gearflow.gearflow_system.Controllers;
import com.gearflow.gearflow_system.DTOs.LoginDTO;
import com.gearflow.gearflow_system.DTOs.LoginResponseDTO;
import com.gearflow.gearflow_system.Services.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;
    private final UserDetailsService users;
    private final SecurityContextRepository contextRepository;

    public AuthController(AuthService authService, UserDetailsService users,
            SecurityContextRepository contextRepository) {
        this.authService = authService;
        this.users = users;
        this.contextRepository = contextRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDTO login,
            HttpServletRequest request, HttpServletResponse response) {
        try {
            // Validação de senha e classificação do perfil centralizadas no serviço
            // existente.
            LoginResponseDTO usuario = authService.autenticar(login);
            UserDetails details = users.loadUserByUsername(login.getEmail().trim());
            Authentication authentication = new UsernamePasswordAuthenticationToken(
                    details, null, details.getAuthorities());
            // Renovar o identificador para reduzir o risco de fixação de sessão.
            HttpSession session = request.getSession(false);
            if (session != null)
                request.changeSessionId();
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            contextRepository.saveContext(context, request, response);
            request.getSession(true).setAttribute("GEARFLOW_USUARIO", usuario);
            return ResponseEntity.ok(usuario);
        } catch (BadCredentialsException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "E-mail ou senha inválidos."));
        }
    }

    @GetMapping("/session")
    public ResponseEntity<?> session(
            Authentication authentication,
            HttpServletRequest request) {

        HttpSession session = request.getSession(false);

        if (authentication == null
                || !authentication.isAuthenticated()
                || session == null
                || !(session.getAttribute("GEARFLOW_USUARIO") instanceof LoginResponseDTO)) {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(
                session.getAttribute("GEARFLOW_USUARIO"));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null)
            session.invalidate();
        SecurityContextHolder.clearContext();
        return ResponseEntity.noContent().build();
    }
}
