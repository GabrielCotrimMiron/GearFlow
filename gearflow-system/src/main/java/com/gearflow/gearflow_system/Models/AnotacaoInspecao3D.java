package com.gearflow.gearflow_system.Models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "anotacao_inspecao_3d", indexes = {
        @Index(name = "idx_inspecao3d_ordem", columnList = "ordem_servico_id")
})
public class AnotacaoInspecao3D {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ordem_servico_id", nullable = false)
    private OrdemServico ordemServico;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private RegiaoVeiculo3D regiao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private GravidadeDiagnostico3D gravidade;

    @Column(nullable = false, length = 100)
    private String titulo;

    @Column(nullable = false, length = 1500)
    private String descricao;

    @Column(nullable = false)
    private boolean resolvido = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    protected AnotacaoInspecao3D() {}

    public AnotacaoInspecao3D(OrdemServico ordemServico, RegiaoVeiculo3D regiao,
                              GravidadeDiagnostico3D gravidade, String titulo, String descricao) {
        this.ordemServico = ordemServico;
        this.regiao = regiao;
        this.gravidade = gravidade;
        this.titulo = titulo;
        this.descricao = descricao;
    }

    @PrePersist
    public void prePersist() {
        if (criadoEm == null) criadoEm = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public OrdemServico getOrdemServico() { return ordemServico; }
    public RegiaoVeiculo3D getRegiao() { return regiao; }
    public GravidadeDiagnostico3D getGravidade() { return gravidade; }
    public String getTitulo() { return titulo; }
    public String getDescricao() { return descricao; }
    public boolean isResolvido() { return resolvido; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
    public void setResolvido(boolean resolvido) { this.resolvido = resolvido; }
}
