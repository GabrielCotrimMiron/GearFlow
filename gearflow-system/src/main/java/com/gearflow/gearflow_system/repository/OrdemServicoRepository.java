package com.gearflow.gearflow_system.Repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gearflow.gearflow_system.Models.OrdemServico;

public interface OrdemServicoRepository
        extends JpaRepository<OrdemServico, Integer> {

    List<OrdemServico> findByVeiculoIdOrderByDataEntradaDesc(Integer veiculoId);

}