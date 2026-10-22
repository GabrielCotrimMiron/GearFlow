package com.gearflow.gearflow_system.model;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
public class Funcionario extends Usuario {

    private String matricula;

    @Enumerated(EnumType.STRING)
    private NivelAcesso nivelAcesso;

    public boolean verificarPermissao(String acao) {
        return true;
    }
}