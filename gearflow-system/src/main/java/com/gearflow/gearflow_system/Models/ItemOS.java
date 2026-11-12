package com.gearflow.gearflow_system.Models;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
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
import lombok.Setter;

@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@Getter
@Setter
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
    @JsonIgnore
    private OrdemServico ordemServico;

    public BigDecimal calcularSubtotalPreciso() {
        if (valorUni == null || qtd == null) return BigDecimal.ZERO;
        return valorUni.multiply(BigDecimal.valueOf(qtd));
    }

    public double calcularSubtotal() {
        return calcularSubtotalPreciso().doubleValue();
    }

    protected void verificarAlteracao() {
        if (ordemServico != null) {
            ordemServico.verificarSeFinalizada();
        }
    }

    public void setDescricao(String descricao) {
        verificarAlteracao();
        this.descricao = descricao;
    }

    public void setQtd(Integer qtd) {
        verificarAlteracao();
        this.qtd = qtd;
    }

    public void setValorUni(BigDecimal valorUni) {
        verificarAlteracao();
        this.valorUni = valorUni;
    }

    public void setOrdemServico(OrdemServico ordemServico) {
        verificarAlteracao();

        if (ordemServico != null) {
            ordemServico.verificarSeFinalizada();
        }

        this.ordemServico = ordemServico;
    }
}