package com.gearflow.gearflow_system.Models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
    @JoinColumn(name = "cliente_id",  nullable =true)
    private Cliente cliente;
    private String nomeProprietario;

    public void atualizarQuilometragem(int novaKm) {
        if (novaKm < 0 || (kmAtual != null && novaKm < kmAtual)) {
            throw new IllegalArgumentException("A quilometragem não pode ser negativa ou diminuir.");
        }
        this.kmAtual = novaKm;
    }

}
