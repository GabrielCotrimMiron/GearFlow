
package com.gearflow.gearflow_system.DTOs;

import java.math.BigDecimal;

public record ResultadoFinanceiroDTO(
        BigDecimal totalRecebido,
        BigDecimal totalDespesas,
        BigDecimal lucroEstimado
) {
}
