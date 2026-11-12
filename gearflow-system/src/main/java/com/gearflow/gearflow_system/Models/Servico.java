package com.gearflow.gearflow_system.Models;

import jakarta.persistence.Entity;

import lombok.Getter;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Entity
@Getter
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Servico extends ItemOS {

    private Integer tempoEstim;
    private String categoria;

    public void aplicarDesconto(double porcentagem) {
        verificarAlteracao();
        if (!Double.isFinite(porcentagem) || porcentagem < 0 || porcentagem > 100) {
            throw new IllegalArgumentException("O desconto deve estar entre 0 e 100%.");
        }
        if (this.getValorUni() == null) {
            throw new IllegalArgumentException("O serviço precisa ter preço definido.");
        }
        BigDecimal fator = BigDecimal.ONE.subtract(BigDecimal.valueOf(porcentagem).movePointLeft(2));
        this.setValorUni(this.getValorUni().multiply(fator).setScale(2, RoundingMode.HALF_UP));
    }

    public void setTempoEstim(Integer tempoEstim) {
        verificarAlteracao();
        this.tempoEstim = tempoEstim;
    }

    public void setCategoria(String categoria) {
        verificarAlteracao();
        this.categoria = categoria;
    }
}