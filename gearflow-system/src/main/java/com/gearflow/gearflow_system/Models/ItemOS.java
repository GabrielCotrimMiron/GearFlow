package com.gearflow.gearflow_system.Models;

import java.math.BigDecimal;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@Getter
@NoArgsConstructor
@AllArgsConstructor
public abstract class ItemOS {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String descricao;
    private BigDecimal valorUni;
    private Integer qtd;

    @ManyToOne
    @JoinColumn(name = "ordem_servico_id")
    private OrdemServico ordemServico;

    public double calcularSubtotal() {
        if (valorUni != null && qtd != null) {
            return valorUni.doubleValue() * qtd;
        }

        return 0.0;
    }

    protected void verificarSePodeAlterar() {
        if (ordemServico != null) {
            ordemServico.verificarSeFinalizada();
        }
    }

    public void setDescricao(String descricao) {
        verificarSePodeAlterar();
        this.descricao = descricao;
    }

    public void setQtd(Integer qtd) {
        verificarSePodeAlterar();
        this.qtd = qtd;
    }

    public void setValorUni(BigDecimal valorUni) {
        verificarSePodeAlterar();
        this.valorUni = valorUni;
    }

    public void setOrdemServico(OrdemServico ordemServico) {
        verificarSePodeAlterar();

        if (ordemServico != null) {
            ordemServico.verificarSeFinalizada();
        }

        this.ordemServico = ordemServico;
    }
}