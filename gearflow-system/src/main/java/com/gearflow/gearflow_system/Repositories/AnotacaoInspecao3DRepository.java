package com.gearflow.gearflow_system.Repositories;

import com.gearflow.gearflow_system.Models.AnotacaoInspecao3D;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AnotacaoInspecao3DRepository extends JpaRepository<AnotacaoInspecao3D, Long> {
    List<AnotacaoInspecao3D> findByOrdemServicoIdOrderByCriadoEmAscIdAsc(Integer ordemServicoId);
}
