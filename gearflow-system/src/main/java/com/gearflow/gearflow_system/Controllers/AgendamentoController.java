package com.gearflow.gearflow_system.Controllers;

import com.gearflow.gearflow_system.Models.Agendamento;
import com.gearflow.gearflow_system.Services.AgendamentoService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/agendamentos")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class AgendamentoController {

    private final AgendamentoService agendamentoService;

    public AgendamentoController(AgendamentoService agendamentoService) {
        this.agendamentoService = agendamentoService;
    }

    @GetMapping("/horarios-disponiveis")
    public List<String> listarHorariosDisponiveis(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return agendamentoService.listarHorariosDisponiveis(data);
    }

    @GetMapping
    public List<Agendamento> listarTodos() {
        return agendamentoService.listarTodos();
    }

    @PostMapping("/meus")
    @ResponseStatus(HttpStatus.CREATED)
    public Agendamento solicitarAgendamento(@RequestBody Agendamento agendamento, Authentication authentication) {
        return agendamentoService.solicitarAgendamento(agendamento, authentication);
    }

    @GetMapping("/meus")
    public List<Agendamento> listarMeusAgendamentos(Authentication authentication) {
        return agendamentoService.listarMeusAgendamentos(authentication);
    }
}
