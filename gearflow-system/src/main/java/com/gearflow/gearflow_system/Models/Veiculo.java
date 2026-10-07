package com.gearflow.gearflow_system.Models;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Veiculo {
    private Integer id;
    private String placa;
    private String chassi;
    private String marca;
    private String modelo;
    private Integer ano;
    private Integer kmAtual;
    private Cliente cliente;

    public void atualizarQuilometragem(int novaKm) {
        this.kmAtual = novaKm;
    }

    public List<OrdemServico> obterHistoricoManutencoes() {
        // No futuro, isso pode buscar do banco de dados
        return new ArrayList<>();
    }
}