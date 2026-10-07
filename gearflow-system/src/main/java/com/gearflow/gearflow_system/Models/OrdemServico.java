package com.gearflow.gearflow_system.Models;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;

import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
public class OrdemServico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "veiculo_id")
    private Veiculo veiculo;

    @ManyToOne
    @JoinColumn(name = "funcionario_id")
    private Funcionario mecanResp;

    private LocalDate dataEntrada;
    private LocalDate previsaoEntrega;

    @Enumerated(EnumType.STRING)
    private StatusOperacional statusOperac;

    @Enumerated(EnumType.STRING)
    private StatusPagamento statusPag;

    @OneToMany(mappedBy = "ordemServico")
    private List<ItemOS> itens = new ArrayList<>();

    private String obsDiag;

    public void adicionarItem(ItemOS item) {
        this.itens.add(item);
        item.setOrdemServico(this);
    }

    public void removerItem(ItemOS item) {
        this.itens.remove(item);
        item.setOrdemServico(null);
    }

    public double calcularTotal() {
        return itens.stream()
                .mapToDouble(ItemOS::calcularSubtotal)
                .sum();
    }

    public void avancarStatus(StatusOperacional novoStatus) {
        this.statusOperac = novoStatus;
    }
}