package com.gearflow.gearflow_system.Models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Agendamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "cliente_id", nullable = false)
    @JsonIgnoreProperties({"veiculos", "senha"})
    private Cliente cliente;

    @ManyToOne
    @JoinColumn(name = "veiculo_id", nullable = false)
    @JsonIgnoreProperties({"cliente"})
    private Veiculo veiculo;

    @Column(nullable = false)
    private LocalDate dataAgendamento;

    @Column(nullable = false)
    private LocalTime horario;

    @Column(length = 500)
    private String motivo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusAgendamento status = StatusAgendamento.PENDENTE;

    @OneToOne
    @JoinColumn(name = "ordem_servico_id")
    @JsonIgnoreProperties({"cliente", "veiculo", "itens"})
    private OrdemServico ordemServico;
}