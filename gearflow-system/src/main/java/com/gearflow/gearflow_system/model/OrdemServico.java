package com.gearflow.gearflow_system.model;

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
import java.util.Collections;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
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

    public List<ItemOS> getItens() {
        return Collections.unmodifiableList(itens);
    }

    private String obsDiag;

    public void adicionarItem(ItemOS item) {
        verificarSeFinalizada();

        this.itens.add(item);
        item.setOrdemServico(this);
    }

    public void removerItem(ItemOS item) {
        verificarSeFinalizada();

        this.itens.remove(item);
        item.setOrdemServico(null);
    }

    public double calcularTotal() {
        return itens.stream()
                .mapToDouble(ItemOS::calcularSubtotal)
                .sum();
    }

    public void avancarStatus(StatusOperacional novoStatus) {
        verificarSeFinalizada();

        this.statusOperac = novoStatus;
    }

    public void verificarSeFinalizada() {
        if (this.statusOperac == StatusOperacional.FINALIZADA) {
            throw new IllegalStateException(
                    "Esta ordem de servico esta finalizada e nao pode ser alterada.");
        }
    }

    public void setVeiculo(Veiculo veiculo) {
        verificarSeFinalizada();
        this.veiculo = veiculo;
    }

    public void setMecanResp(Funcionario mecanResp) {
        verificarSeFinalizada();
        this.mecanResp = mecanResp;
    }

    public void setDataEntrada(LocalDate dataEntrada) {
        verificarSeFinalizada();
        this.dataEntrada = dataEntrada;
    }

    public void setPrevisaoEntrega(LocalDate previsaoEntrega) {
        verificarSeFinalizada();
        this.previsaoEntrega = previsaoEntrega;
    }

    public void setStatusOperac(StatusOperacional statusOperac) {
        verificarSeFinalizada();
        this.statusOperac = statusOperac;
    }

    public void setStatusPag(StatusPagamento statusPag) {
        verificarSeFinalizada();
        this.statusPag = statusPag;
    }

    public void setObsDiag(String obsDiag) {
        verificarSeFinalizada();
        this.obsDiag = obsDiag;
    }

}