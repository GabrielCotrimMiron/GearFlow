package com.gearflow.gearflow_system.Repositories;

import com.gearflow.gearflow_system.Models.Cliente;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClienteRepository extends JpaRepository<Cliente, Integer> {

    Optional<Cliente> findByEmailIgnoreCase(String email);
}
