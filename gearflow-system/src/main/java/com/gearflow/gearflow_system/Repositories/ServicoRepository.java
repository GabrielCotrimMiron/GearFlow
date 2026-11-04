package com.gearflow.gearflow_system.Repositories;

import com.gearflow.gearflow_system.Models.Servico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ServicoRepository extends JpaRepository<Servico, Integer> {
}