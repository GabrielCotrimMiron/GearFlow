package com.gearflow.gearflow_system.Repositories; // Ajuste para o seu pacote

import com.gearflow.gearflow_system.Models.Peca;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PecaRepository extends JpaRepository<Peca, Integer> {
}