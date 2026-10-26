package com.gearflow.gearflow_system.Models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Veiculo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true, nullable = false)
    private String placa;

    private String chassi;

    private String marca;

    private String modelo;

    private Integer ano;

    private Integer kmAtual;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnoreProperties({
        "cpf",
        "email",
        "telefone",
        "senha",
        "veiculos"
    })
    @ManyToOne
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    public void atualizarQuilometragem(int novaKm) {
        this.kmAtual = novaKm;
    }

    public List<OrdemServico> obterHistoricoManutencoes() {
        return new ArrayList<>();
    }
}
