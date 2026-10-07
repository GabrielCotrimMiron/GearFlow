package com.gearflow.gearflow_system.Models;

import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
public class Cliente extends Usuario {

    private String telefone;

    @OneToMany(mappedBy = "cliente")
    private List<Veiculo> veiculos = new ArrayList<>();

    public void adicionarVeiculo(Veiculo v) {
        this.veiculos.add(v);
        v.setCliente(this);
    }

    public void aprovarOrcamento(OrdemServico os) {
        // Lógica de negócio futura para aprovação
    }
}