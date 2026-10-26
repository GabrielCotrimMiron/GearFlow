package com.gearflow.gearflow_system.dto;

import com.gearflow.gearflow_system.model.OrdemServico;
import com.gearflow.gearflow_system.model.Funcionario;
import com.gearflow.gearflow_system.model.StatusOperacional;

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
