
package com.gearflow.gearflow_system.DTOs;

import java.time.LocalDate;

import com.gearflow.gearflow_system.Models.OrdemServico;
import com.gearflow.gearflow_system.Models.PrioridadeOS;
import com.gearflow.gearflow_system.Models.StatusOperacional;

public class FilaPrioridadeDTO {

    private final Integer id;
    private final LocalDate dataEntrada;
    private final LocalDate previsaoEntrega;
    private final PrioridadeOS prioridade;
    private final StatusOperacional status;

    public FilaPrioridadeDTO(OrdemServico ordem) {
        this.id = ordem.getId();
        this.dataEntrada = ordem.getDataEntrada();
        this.previsaoEntrega = ordem.getPrevisaoEntrega();
        this.prioridade = ordem.getPrioridade() != null
                ? ordem.getPrioridade()
                : PrioridadeOS.NORMAL;
        this.status = ordem.getStatusOperac();
    }

    public Integer getId() {
        return id;
    }

    public LocalDate getDataEntrada() {
        return dataEntrada;
    }

    public LocalDate getPrevisaoEntrega() {
        return previsaoEntrega;
    }

    public PrioridadeOS getPrioridade() {
        return prioridade;
    }

    public StatusOperacional getStatus() {
        return status;
    }
}
