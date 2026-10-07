package com.gearflow.gearflow_system.Models;

import jakarta.persistence.Entity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
public class Funcionario extends Usuario {

    private String matricula;

    private String nivelAcesso;

    public boolean verificarPermissao(String acao) {
        return true;
    }
}