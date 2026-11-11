package com.gearflow.gearflow_system.DTOs;

public record ClienteAdminDTO(Integer id, String nome, String email, String cpf,
                              String telefone, long quantidadeVeiculos) {}
