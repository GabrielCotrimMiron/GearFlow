package com.gearflow.gearflow_system.Models;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Peca extends ItemOS {

    private String codFabri;

    public void abaterEstoque(int qtdAbater) {
        // Lógica para diminuir o estoque
    }

    public boolean verificarEstoqueBaixo() {
        // Retorna true se estiver baixo
        return false;
    }
}