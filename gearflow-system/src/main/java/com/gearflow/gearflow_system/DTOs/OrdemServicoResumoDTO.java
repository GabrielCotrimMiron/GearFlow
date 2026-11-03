
package com.gearflow.gearflow_system.DTOs;

import java.time.LocalDate;

import com.gearflow.gearflow_system.Models.OrdemServico;

public record OrdemServicoResumoDTO(
        Integer id,
        String veiculo,
        String placa,
        LocalDate dataEntrada,
        String status
) {
    public OrdemServicoResumoDTO(OrdemServico ordem) {
        this(
                ordem.getId(),
                ordem.getVeiculo().getMarca() + " "
                        + ordem.getVeiculo().getModelo(),
                ordem.getVeiculo().getPlaca(),
                ordem.getDataEntrada(),
                ordem.getStatusOperac() == null
                        ? null
                        : ordem.getStatusOperac().name()
        );
    }
}
