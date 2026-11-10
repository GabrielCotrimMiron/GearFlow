package com.gearflow.gearflow_system.Services;

import com.gearflow.gearflow_system.Models.Agendamento;
import com.gearflow.gearflow_system.Models.Cliente;
import com.gearflow.gearflow_system.Models.StatusAgendamento;
import com.gearflow.gearflow_system.Models.Veiculo;
import com.gearflow.gearflow_system.Repositories.AgendamentoRepository;
import com.gearflow.gearflow_system.Repositories.ClienteRepository;
import com.gearflow.gearflow_system.Repositories.VeiculoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
public class AgendamentoService {

    private final AgendamentoRepository agendamentoRepository;
    private final ClienteRepository clienteRepository;
    private final VeiculoRepository veiculoRepository;

    public AgendamentoService(AgendamentoRepository agendamentoRepository,
                              ClienteRepository clienteRepository,
                              VeiculoRepository veiculoRepository) {
        this.agendamentoRepository = agendamentoRepository;
        this.clienteRepository = clienteRepository;
        this.veiculoRepository = veiculoRepository;
    }

    @Transactional(readOnly = true)
    public List<String> listarHorariosDisponiveis(LocalDate data) { // ← AQUI FOI ALTERADO PARA List<String>
        if (data.isBefore(LocalDate.now())) {
            return new ArrayList<>();
        }

        List<LocalTime> gradeHorarios = new ArrayList<>(Arrays.asList(
                LocalTime.of(8, 0), LocalTime.of(9, 0), LocalTime.of(10, 0),
                LocalTime.of(11, 0), LocalTime.of(13, 0), LocalTime.of(14, 0),
                LocalTime.of(15, 0), LocalTime.of(16, 0), LocalTime.of(17, 0)
        ));

        List<Agendamento> ocupados = agendamentoRepository.findByDataAgendamentoAndStatusIn(
                data, Arrays.asList(StatusAgendamento.PENDENTE, StatusAgendamento.CONFIRMADO));

        for (Agendamento agendamento : ocupados) {
            gradeHorarios.remove(agendamento.getHorario());
        }

        if (data.isEqual(LocalDate.now())) {
            gradeHorarios.removeIf(horario -> horario.isBefore(LocalTime.now()));
        }

        // Converte os horários para texto ("08:00") antes de enviar ao React
        List<String> horariosFormatados = new ArrayList<>();
        for (LocalTime t : gradeHorarios) {
            horariosFormatados.add(t.toString());
        }

        return horariosFormatados;
    }

    @Transactional
    public Agendamento solicitarAgendamento(Agendamento requisicao, Authentication auth) {
        Cliente cliente = clienteRepository.findByEmailIgnoreCase(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente não encontrado."));

        Veiculo veiculo = veiculoRepository.findById(requisicao.getVeiculo().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Veículo não encontrado."));

        // Garante que o cliente só está agendando para um veículo que pertence a ele
        if (!veiculo.getCliente().getId().equals(cliente.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Este veículo não pertence à sua conta.");
        }

        if (requisicao.getDataAgendamento().isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Não é possível agendar em datas passadas.");
        }

        List<String> horariosLivres = listarHorariosDisponiveis(requisicao.getDataAgendamento());
        if (!horariosLivres.contains(requisicao.getHorario().toString())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "O horário selecionado não está mais disponível.");
        }

        Agendamento novoAgendamento = new Agendamento();
        novoAgendamento.setCliente(cliente);
        novoAgendamento.setVeiculo(veiculo);
        novoAgendamento.setDataAgendamento(requisicao.getDataAgendamento());
        novoAgendamento.setHorario(requisicao.getHorario());
        novoAgendamento.setMotivo(requisicao.getMotivo());
        novoAgendamento.setStatus(StatusAgendamento.PENDENTE);

        return agendamentoRepository.save(novoAgendamento);
    }

    @Transactional(readOnly = true)
    public List<Agendamento> listarTodos() {
        return agendamentoRepository.findAllByOrderByDataAgendamentoDescHorarioDesc();
    }

    @Transactional(readOnly = true)
    public List<Agendamento> listarMeusAgendamentos(Authentication auth) {
        return agendamentoRepository.findByClienteEmailIgnoreCaseOrderByDataAgendamentoDescHorarioDesc(auth.getName());
    }
}