
package com.gearflow.gearflow_system.DTOs;

import java.math.BigDecimal;
import java.util.List;

import com.gearflow.gearflow_system.Models.OrdemServico;

public record OrcamentoDTO(
        Integer ordemServicoId,
        String status,
        String diagnostico,
        List<ItemOrcamentoDTO> itens,
        BigDecimal valorTotal,
        BigDecimal desconto,
        BigDecimal valorFinal) {

    public OrcamentoDTO(OrdemServico ordem) {
        this(
                ordem.getId(),
                ordem.getStatusOperac() == null
                        ? null
                        : ordem.getStatusOperac().name(),
                ordem.getObsDiag(),
                ordem.getItens().stream()
                        .map(ItemOrcamentoDTO::new)
                        .toList(),
                calcularTotal(ordem),
                ordem.getDesconto() == null
                        ? BigDecimal.ZERO
                        : ordem.getDesconto(),
                calcularTotal(ordem).subtract(
                        ordem.getDesconto() == null
                                ? BigDecimal.ZERO
                                : ordem.getDesconto()));
    }

    private static BigDecimal calcularTotal(OrdemServico ordem) {
        return ordem.getItens().stream()
                .map(ItemOrcamentoDTO::new)
                .map(ItemOrcamentoDTO::subtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
