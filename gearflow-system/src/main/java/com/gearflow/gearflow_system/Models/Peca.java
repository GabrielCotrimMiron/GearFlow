package com.gearflow.gearflow_system.Models;

import jakarta.persistence.Entity;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Peca extends ItemOS {

    private String codFabri;

    public void abaterEstoque(int qtdAbater) {
        // Lógica futura
    }

    public boolean verificarEstoqueBaixo() {
        return false;
    }
}