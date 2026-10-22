package com.gearflow.gearflow_system.repository;

import com.gearflow.gearflow_system.model.Veiculo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VeiculoRepository extends JpaRepository<Veiculo, Integer> {

    boolean existsByPlacaIgnoreCase(String placa);

}
