package com.gearflow.gearflow_system.Repositories;

import com.gearflow.gearflow_system.Models.Veiculo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VeiculoRepository extends JpaRepository<Veiculo, Integer> {

    boolean existsByPlacaIgnoreCase(String placa);

}
