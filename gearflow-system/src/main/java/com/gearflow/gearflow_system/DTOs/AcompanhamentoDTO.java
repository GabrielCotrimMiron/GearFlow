package com.gearflow.gearflow_system.DTOs;

import com.gearflow.gearflow_system.Models.OrdemServico;
import com.gearflow.gearflow_system.Models.Funcionario;
import com.gearflow.gearflow_system.Models.StatusOperacional;

import lombok.Getter;

@Getter
public class AcompanhamentoDTO {

    private final Integer ordemServicoId;
    private final StatusOperacional status;
    private final String mecanicoResponsavel;

    public AcompanhamentoDTO(OrdemServico ordemServico) {
        this.ordemServicoId = ordemServico.getId();
        this.status = ordemServico.getStatusOperac();

        Funcionario mecanico = ordemServico.getMecanResp();

        this.mecanicoResponsavel = mecanico != null
                ? mecanico.getNome()
                : "Nao atribuido";
    }
}
