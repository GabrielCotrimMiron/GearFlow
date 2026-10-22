package com.gearflow.gearflow_system.controller;

import com.gearflow.gearflow_system.dto.LoginDTO;
import com.gearflow.gearflow_system.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService autenService;

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginDTO login) {
        if (autenService.autenticarAdmin(login)) {
            return ResponseEntity.ok("Administrador autenticado com sucesso!");
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Email ou senha inválidos.");
    }
}