package com.gearflow.gearflow_system.Repositories;

import com.gearflow.gearflow_system.Models.Peca;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PecaRepository extends JpaRepository<Peca, Integer> {

    @Query("SELECT p FROM Peca p WHERE p.ordemServico IS NULL")
    List<Peca> buscarCatalogo();

}