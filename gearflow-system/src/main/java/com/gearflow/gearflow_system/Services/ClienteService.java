package com.gearflow.gearflow_system.Services;

import com.gearflow.gearflow_system.dto.ClienteDTO;
import com.gearflow.gearflow_system.Models.Cliente;
import com.gearflow.gearflow_system.Repositories.ClienteRepository;
import org.springframework.stereotype.Service;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    public Cliente cadastrarCliente(ClienteDTO dto) {
        Cliente cliente = new Cliente();
        cliente.setNome(dto.getNome());
        cliente.setEmail(dto.getEmail());
        cliente.setSenha(dto.getSenha()); // Em um cenário real, deve ser criptografada (ex: BCrypt)
        cliente.setCpf(dto.getCpf());
        cliente.setTelefone(dto.getTelefone());

        return clienteRepository.save(cliente);
    }

    public Cliente atualizarCliente(Integer id, ClienteDTO dto) {
        // Busca o cliente existente ou lança erro
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));

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
