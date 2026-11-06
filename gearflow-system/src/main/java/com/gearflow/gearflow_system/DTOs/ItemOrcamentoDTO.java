
package com.gearflow.gearflow_system.DTOs;

import java.math.BigDecimal;

import com.gearflow.gearflow_system.Models.ItemOS;
import com.gearflow.gearflow_system.Models.Peca;
import com.gearflow.gearflow_system.Models.Servico;

public record ItemOrcamentoDTO(
        Integer id,
        String tipo,
        String descricao,
        Integer quantidade,
        BigDecimal valorUnitario,
        BigDecimal subtotal
) {

    public ItemOrcamentoDTO(ItemOS item) {
        this(
                item.getId(),
                identificarTipo(item),
                item.getDescricao(),
                item.getQtd(),
                item.getValorUni(),
                calcularSubtotal(item)
        );
    }

    private static String identificarTipo(ItemOS item) {
        Object real = org.hibernate.Hibernate.unproxy(item);
        if (real instanceof Peca) {
            return "PECA";
        }
        if (real instanceof Servico) {
            return "SERVICO";
        }
        return "OUTRO";
    }

    private static BigDecimal calcularSubtotal(ItemOS item) {
        if (item.getValorUni() == null || item.getQtd() == null) {
            return BigDecimal.ZERO;
        }

        return item.getValorUni()
                .multiply(BigDecimal.valueOf(item.getQtd()));
    }
}
