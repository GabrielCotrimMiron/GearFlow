
package com.gearflow.gearflow_system.Repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.gearflow.gearflow_system.Models.OrdemServico;

public interface OrdemServicoRepository
        extends JpaRepository<OrdemServico, Integer> {

    List<OrdemServico> findByVeiculoIdOrderByDataEntradaDesc(
            Integer veiculoId);

    List<OrdemServico> findByVeiculoClienteEmailIgnoreCaseOrderByDataEntradaDesc(
            String email);

    // RF05 - Fila organizada por prioridade.
    @Query("""
        SELECT os FROM OrdemServico os
        ORDER BY CASE
            WHEN os.prioridade = 'URGENTE' THEN 1
            WHEN os.prioridade = 'ALTA' THEN 2
            ELSE 3
        END ASC, os.dataEntrada ASC, os.id ASC
        """)
    List<OrdemServico> listarFilaPrioridade();
}
