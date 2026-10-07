package com.gearflow.gearflow_system.Models;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public abstract class ItemOS {
    private Integer id;
    private String descricao; // Ajustado de int (no diagrama) para String
    private BigDecimal valorUni; // Ajustado de int (no diagrama) para BigDecimal
    private Integer qtd;

    public double calcularSubtotal() {
        if (valorUni != null && qtd != null) {
            return valorUni.doubleValue() * qtd;
        }
        return 0.0;
    }
}
