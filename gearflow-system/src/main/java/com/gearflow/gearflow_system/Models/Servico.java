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
        if (porcentagem > 0 && porcentagem <= 100 && this.getValorUni() != null) {
            BigDecimal fatorDesconto = BigDecimal.valueOf(1.0 - (porcentagem / 100.0));
            BigDecimal novoValor = this.getValorUni().multiply(fatorDesconto).setScale(2, RoundingMode.HALF_UP);
            this.setValorUni(novoValor);
        }
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