package com.gearflow.gearflow_system.DTOs;

import lombok.Data;

@Data
public class ClienteDTO {
    private String nome;
    private String email;
    private String senha;
    private String cpf;
    private String telefone;
}