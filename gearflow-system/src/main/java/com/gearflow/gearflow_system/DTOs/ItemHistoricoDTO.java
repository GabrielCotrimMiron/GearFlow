package com.gearflow.gearflow_system.DTOs;

import java.math.BigDecimal;

import com.gearflow.gearflow_system.Models.ItemOS;

import lombok.Getter;

@Getter
public class ItemHistoricoDTO {

    private final String descricao;
    private final Integer quantidade;
    private final BigDecimal valorUnitario;
    private final double subtotal;

    public ItemHistoricoDTO(ItemOS item) {
        this.descricao = item.getDescricao();
        this.quantidade = item.getQtd();
        this.valorUnitario = item.getValorUni();
        this.subtotal = item.calcularSubtotal();
    }
}