
package com.gearflow.gearflow_system.DTOs;

import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;

import com.gearflow.gearflow_system.Models.OrdemServico;

public record OrdemServicoGestaoDTO(
        Integer id,
        String statusOperac,
        String prioridade,
        String statusPag,
        LocalDate dataEntrada,
        LocalDate previsaoEntrega,
        String obsDiag,
        VeiculoResumo veiculo,
        FuncionarioResumo mecanResp,
        BigDecimal valorTotal,
        BigDecimal desconto,
        BigDecimal valorFinal,
        List<ItemOrcamentoDTO> itens){

    public record VeiculoResumo(
            Integer id,
            String marca,
            String modelo,
            String placa,
            ClienteResumo cliente) {}

    public record ClienteResumo(String nome) {}

    public record FuncionarioResumo(String nome) {}

    public OrdemServicoGestaoDTO(OrdemServico os) {
        this(
                os.getId(),
                os.getStatusOperac() == null
                        ? null : os.getStatusOperac().name(),
                os.getPrioridade() == null
                        ? null : os.getPrioridade().name(),
                os.getStatusPag() == null
                        ? null : os.getStatusPag().name(),
                os.getDataEntrada(),
                os.getPrevisaoEntrega(),
                os.getObsDiag(),
                os.getVeiculo() == null ? null
                        : new VeiculoResumo(
                                os.getVeiculo().getId(),
                                os.getVeiculo().getMarca(),
                                os.getVeiculo().getModelo(),
                                os.getVeiculo().getPlaca(),
                                os.getVeiculo().getCliente() == null
                                        ? null
                                        : new ClienteResumo(
                                                os.getVeiculo().getCliente().getNome())),
                os.getMecanResp() == null ? null
                        : new FuncionarioResumo(os.getMecanResp().getNome()),
                os.calcularTotalPreciso(),
                os.getDesconto() == null
                        ? BigDecimal.ZERO : os.getDesconto(),
                os.calcularTotalComDesconto(),
                // MAPEAMENTO DA LISTA DE ITENS AQUI:
                os.getItens() == null
                        ? List.of()
                        : os.getItens().stream().map(ItemOrcamentoDTO::new).toList());
    }
}
