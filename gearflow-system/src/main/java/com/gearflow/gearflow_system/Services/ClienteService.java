package com.gearflow.gearflow_system.Services;

import com.gearflow.gearflow_system.DTOs.ClienteDTO;
import com.gearflow.gearflow_system.Models.Cliente;
import com.gearflow.gearflow_system.Repositories.ClienteRepository;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.gearflow.gearflow_system.Repositories.UsuarioRepository;
import java.util.Locale;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final UsuarioRepository usuarioRepository;

    public ClienteService(ClienteRepository clienteRepository, UsuarioRepository usuarioRepository) {
        this.clienteRepository = clienteRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public Cliente cadastrarCliente(ClienteDTO dto) {
        if (dto == null || dto.getNome() == null || dto.getNome().isBlank()
                || dto.getEmail() == null || dto.getEmail().isBlank()
                || dto.getSenha() == null || dto.getSenha().isBlank()
                || dto.getCpf() == null || dto.getCpf().isBlank()
                || dto.getTelefone() == null || dto.getTelefone().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Preencha todos os campos obrigatorios.");
        }
        String email = dto.getEmail().trim().toLowerCase(Locale.ROOT);
        if (usuarioRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail ja cadastrado.");
        }
        Cliente cliente = new Cliente();
        cliente.setNome(dto.getNome().trim());
        cliente.setEmail(email);
        cliente.setSenha(dto.getSenha()); // Senhas locais em texto simples: corrigir antes de publicar.
        cliente.setCpf(dto.getCpf().trim());
        cliente.setTelefone(dto.getTelefone().trim());
        return clienteRepository.save(cliente);
    }

    public Cliente atualizarCliente(Integer id, ClienteDTO dto) {
        // Busca o cliente existente ou lança erro
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente não encontrado"));

        // Atualiza apenas os dados permitidos
        cliente.setNome(dto.getNome());
        cliente.setTelefone(dto.getTelefone());

        // Se a senha não vier vazia, atualiza também
        if (dto.getSenha() != null && !dto.getSenha().isEmpty()) {
            cliente.setSenha(dto.getSenha());
        }

        return clienteRepository.save(cliente);
    }
}
