package com.gearflow.gearflow_system.Models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Entity;

import lombok.Getter;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Peca extends ItemOS {

    private String codFabri;
    private Integer qtdEstoque;

    public void abaterEstoque(int qtdAbater) {
        if (this.getQtdEstoque() != null && this.getQtdEstoque() >= qtdAbater) {
            this.qtdEstoque -= qtdAbater;
        } else {
            throw new IllegalArgumentException("Estoque insuficiente para a peça: " + this.getDescricao());
        }
    }

    @JsonProperty("estoqueBaixo")
    public boolean verificarEstoqueBaixo() {
        return this.getQtdEstoque() != null && this.getQtdEstoque() <= 5;
    }

    public void setCodFabri(String codFabri) {
        verificarAlteracao();
        this.codFabri = codFabri;
    }
    public void setQtdEstoque(Integer qtdEstoque) {
        verificarAlteracao();
        this.qtdEstoque = qtdEstoque;
    }
}