package com.gearflow.gearflow_system.Models;

import jakarta.persistence.Entity;

import lombok.Getter;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Getter
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

    public void setCodFabri(String codFabri) {
        verificarSePodeAlterar();
        this.codFabri = codFabri;
    }
}