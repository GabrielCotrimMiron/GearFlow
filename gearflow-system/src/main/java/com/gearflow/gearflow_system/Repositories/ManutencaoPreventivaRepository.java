package com.gearflow.gearflow_system.Repositories;

import com.gearflow.gearflow_system.Models.ManutencaoPreventiva;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ManutencaoPreventivaRepository extends JpaRepository<ManutencaoPreventiva, Integer> {
    List<ManutencaoPreventiva> findByVeiculoClienteEmailIgnoreCaseAndAtivaTrueOrderByKmPrevistaAsc(String email);
    List<ManutencaoPreventiva> findByVeiculoIdOrderByKmPrevistaAsc(Integer veiculoId);
}
