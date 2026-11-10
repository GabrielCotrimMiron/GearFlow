package com.gearflow.gearflow_system.Repositories;

import com.gearflow.gearflow_system.Models.Agendamento;
import com.gearflow.gearflow_system.Models.StatusAgendamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface AgendamentoRepository extends JpaRepository<Agendamento, Integer> {

    List<Agendamento> findByDataAgendamentoAndStatusIn(LocalDate data, List<StatusAgendamento> status);

    List<Agendamento> findAllByOrderByDataAgendamentoDescHorarioDesc();

    List<Agendamento> findByClienteEmailIgnoreCaseOrderByDataAgendamentoDescHorarioDesc(String email);
}