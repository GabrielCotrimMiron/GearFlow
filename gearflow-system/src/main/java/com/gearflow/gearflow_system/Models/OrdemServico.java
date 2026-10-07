package com.gearflow.gearflow_system.Models;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class OrdemServico {
    private Integer id;
    private Veiculo veiculo;
    private Funcionario mecanResp;

    // Substituindo 'int' do diagrama por tipos de Data do Java
    private LocalDate dataEntrada;
    private LocalDate previsaoEntrega;

    // Conectando com os Enums em vez de usar 'int'
    private StatusOperacional statusOperac;
    private StatusPagamento statusPag;

    // Lista polimórfica que aceitará tanto Peca quanto Servico
    private List<ItemOS> itens = new ArrayList<>();
    private String obsDiag;

    public void adicionarItem(ItemOS item) {
        this.itens.add(item);
    }

    public void removerItem(ItemOS item) {
        this.itens.remove(item);
    }

    public double calcularTotal() {
        return this.itens.stream()
                .mapToDouble(ItemOS::calcularSubtotal)
                .sum();
    }

    public void avancarStatus(StatusOperacional novoStatus) {
        this.statusOperac = novoStatus;
    }
}