package com.gearflow.gearflow_system.repository;

import com.gearflow.gearflow_system.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    // O Spring gera automaticamente a query SQL para procurar o e-mail
    Optional<Usuario> findByEmail(String email);
}