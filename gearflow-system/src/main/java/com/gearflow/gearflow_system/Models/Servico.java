package com.gearflow.gearflow_system.Models;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Servico extends ItemOS {

    private Integer tempoEstim; // Em minutos ou horas
    private String categoria;

    public void aplicarDesconto(double porcentagem) {
        // Lógica para reduzir o valorUni baseado na porcentagem
    }
}