
package com.gearflow.gearflow_system.DTOs;

import java.math.BigDecimal;
import java.time.LocalDate;

public record HistoricoFinanceiroDTO(
        Integer id,
        LocalDate dataEntrada,
        String statusOperacional,
        String statusPagamento,
        BigDecimal valor
) {
}
