package com.gearflow.gearflow_system.Controllers;

import com.gearflow.gearflow_system.dto.ClienteDTO;
import com.gearflow.gearflow_system.Models.Cliente;
import com.gearflow.gearflow_system.Services.ClienteService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/clientes")
@CrossOrigin(origins = "http://localhost:5173")
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    // Endpoint público para o cliente criar a própria conta (RF11)
    @PostMapping("/registro")
    @ResponseStatus(HttpStatus.CREATED)
    public Cliente registrar(@RequestBody ClienteDTO dto) {
        return clienteService.cadastrarCliente(dto);
    }

    // Endpoint para o cliente gerenciar os próprios dados
    @PutMapping("/{id}")
    public Cliente atualizarDados(@PathVariable Integer id, @RequestBody ClienteDTO dto) {
        return clienteService.atualizarCliente(id, dto);
    }
}