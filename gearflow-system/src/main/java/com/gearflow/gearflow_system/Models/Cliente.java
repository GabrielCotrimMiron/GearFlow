package com.gearflow.gearflow_system.Models;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true) // Garante que o Lombok considere os atributos do Usuario (Pai)
public class Cliente extends Usuario {

    private String telefone;
    private List<Veiculo> veiculos = new ArrayList<>();

    public void adicionarVeiculo(Veiculo v) {
        this.veiculos.add(v);
        v.setCliente(this); // Mantém a via de mão dupla da associação
    }

    public void aprovarOrcamento(OrdemServico os) {
        // Lógica de negócio futura para aprovação
    }
}
