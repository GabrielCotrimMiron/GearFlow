package com.gearflow.gearflow_system.DTOs;

import com.gearflow.gearflow_system.Models.*;
import java.time.LocalDateTime;
import java.util.List;

public final class Inspecao3DDTO {
    private Inspecao3DDTO() {}

    public record Criar(RegiaoVeiculo3D regiao, GravidadeDiagnostico3D gravidade,
                        String titulo, String descricao) {}
    public record Atualizar(boolean resolvido) {}
    public record Anotacao(Long id, RegiaoVeiculo3D regiao, GravidadeDiagnostico3D gravidade,
                           String titulo, String descricao, boolean resolvido, LocalDateTime criadoEm) {
        public Anotacao(AnotacaoInspecao3D a) {
            this(a.getId(), a.getRegiao(), a.getGravidade(), a.getTitulo(),
                 a.getDescricao(), a.isResolvido(), a.getCriadoEm());
        }
    }
    public record VeiculoInfo(Integer id, String marca, String modelo, String placa, Integer ano) {
        public VeiculoInfo(Veiculo v) {
            this(v.getId(), v.getMarca(), v.getModelo(), v.getPlaca(), v.getAno());
        }
    }
    public record Resultado(Integer ordemServicoId, String statusOS, VeiculoInfo veiculo,
                            String diagnosticoGeral, List<Anotacao> anotacoes) {}
}
