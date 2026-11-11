package com.gearflow.gearflow_system.Models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class ManutencaoPreventiva {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "veiculo_id", nullable = false)
    private Veiculo veiculo;

    @Column(nullable = false, length = 120)
    private String descricao;

    @Column(nullable = false)
    private Integer kmPrevista;

    @Column(nullable = false)
    private Integer antecedenciaKm = 1000;

    @Column(nullable = false)
    private Boolean ativa = true;
}
