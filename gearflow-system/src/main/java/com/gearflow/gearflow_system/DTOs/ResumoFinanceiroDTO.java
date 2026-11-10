
package com.gearflow.gearflow_system.DTOs;

import java.math.BigDecimal;

public record ResumoFinanceiroDTO(
        BigDecimal faturamentoFinalizado,
        BigDecimal totalPago,
        BigDecimal totalPendente,
        BigDecimal totalEstornado,
        long quantidadeOSFinalizadas,
        long quantidadeOSPagas,
        long quantidadeOSPendentes
) {
}
