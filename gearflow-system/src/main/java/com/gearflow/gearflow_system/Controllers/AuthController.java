package com.gearflow.gearflow_system.Controllers;

import com.gearflow.gearflow_system.DTOs.LoginDTO;
import com.gearflow.gearflow_system.DTOs.LoginResponseDTO;
import com.gearflow.gearflow_system.Services.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDTO login) {
        try {
            // Agora o serviço devolve o objeto completo com o tipo de painel
            LoginResponseDTO resposta = authService.autenticar(login);
            return ResponseEntity.ok(resposta);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }
}