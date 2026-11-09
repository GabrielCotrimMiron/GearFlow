package com.gearflow.gearflow_system.Repositories;

import com.gearflow.gearflow_system.Models.Servico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServicoRepository extends JpaRepository<Servico, Integer> {

    @Query("SELECT s FROM Servico s WHERE s.ordemServico IS NULL")
    List<Servico> buscarCatalogo();

}