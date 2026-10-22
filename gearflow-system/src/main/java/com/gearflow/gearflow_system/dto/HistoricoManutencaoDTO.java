package com.gearflow.gearflow_system.dto;

import java.time.LocalDate;
import com.gearflow.gearflow_system.model.OrdemServico;
import com.gearflow.gearflow_system.model.StatusOperacional;
import com.gearflow.gearflow_system.model.StatusPagamento;
import java.util.List;
import java.util.ArrayList;
import com.gearflow.gearflow_system.model.ItemOS;
import lombok.Getter;

@Getter
public class HistoricoManutencaoDTO {

    private final Integer id;
    private final LocalDate dataEntrada;
    private final LocalDate previsaoEntrega;
    private final StatusOperacional statusOperac;
    private final StatusPagamento statusPag;
    private final String obsDiag;
    private final double valorTotal;
    private final List<ItemHistoricoDTO> itens;

    public HistoricoManutencaoDTO(OrdemServico ordemServico) {
        this.id = ordemServico.getId();
        this.dataEntrada = ordemServico.getDataEntrada();
        this.previsaoEntrega = ordemServico.getPrevisaoEntrega();
        this.statusOperac = ordemServico.getStatusOperac();
        this.statusPag = ordemServico.getStatusPag();
        this.obsDiag = ordemServico.getObsDiag();
        this.valorTotal = ordemServico.calcularTotal();
        this.itens = new ArrayList<>();

        for (ItemOS item : ordemServico.getItens()) {
            this.itens.add(new ItemHistoricoDTO(item));
        }
    }
}