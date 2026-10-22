package com.gearflow.gearflow_system.Models;

import jakarta.persistence.Entity;

import lombok.Getter;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Servico extends ItemOS {

    private Integer tempoEstim;
    private String categoria;

    public void aplicarDesconto(double porcentagem) {
        // Lógica futura
    }

    public void setTempoEstim(Integer tempoEstim) {
        verificarSePodeAlterar();
        this.tempoEstim = tempoEstim;
    }

    public void setCategoria(String categoria) {
        verificarSePodeAlterar();
        this.categoria = categoria;
    }
}