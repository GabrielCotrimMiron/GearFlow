package com.gearflow.gearflow_system.Models;

import jakarta.persistence.Entity;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Servico extends ItemOS {

    private Integer tempoEstim;
    private String categoria;

    public void aplicarDesconto(double porcentagem) {
        // Lógica futura
    }
}