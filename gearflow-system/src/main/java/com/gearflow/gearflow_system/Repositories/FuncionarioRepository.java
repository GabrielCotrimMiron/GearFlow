package com.gearflow.gearflow_system.Repositories;

import com.gearflow.gearflow_system.Models.Funcionario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FuncionarioRepository extends JpaRepository<Funcionario, Integer> {
    Funcionario findTopByOrderByIdDesc();
}