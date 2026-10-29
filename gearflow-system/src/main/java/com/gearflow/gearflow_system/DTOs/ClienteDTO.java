package com.gearflow.gearflow_system.dto;

import lombok.Data;

@Data
public class ClienteDTO {
    private String nome;
    private String email;
    private String senha;
    private String cpf;
    private String telefone;
}