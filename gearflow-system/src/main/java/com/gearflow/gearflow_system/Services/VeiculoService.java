package com.gearflow.gearflow_system.Services;

import com.gearflow.gearflow_system.Models.Cliente;
import com.gearflow.gearflow_system.Models.Veiculo;
import com.gearflow.gearflow_system.Repositories.ClienteRepository;
import com.gearflow.gearflow_system.Repositories.VeiculoRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.gearflow.gearflow_system.Models.OrdemServico;
import com.gearflow.gearflow_system.Repositories.OrdemServicoRepository;
import com.gearflow.gearflow_system.DTOs.HistoricoManutencaoDTO;

@Service
public class VeiculoService {

    private final VeiculoRepository veiculoRepository;
    private final ClienteRepository clienteRepository;
    private final OrdemServicoRepository ordemServicoRepository;

    public VeiculoService(
            VeiculoRepository veiculoRepository,
            ClienteRepository clienteRepository,
            OrdemServicoRepository ordemServicoRepository) {

        this.veiculoRepository = veiculoRepository;
        this.clienteRepository = clienteRepository;
        this.ordemServicoRepository = ordemServicoRepository;
    }

    @Transactional
    public Veiculo cadastrar(Veiculo veiculo) {
        validarDados(veiculo);

        if (veiculo.getId() != null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O ID não deve ser informado no cadastro.");
        }

        String placa = normalizarPlaca(veiculo.getPlaca());

        if (!placa.matches("[A-Z]{3}[0-9][A-Z0-9][0-9]{2}")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A placa deve estar no formato brasileiro válido.");
        }

        if (veiculoRepository.existsByPlacaIgnoreCase(placa)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Já existe um veículo cadastrado com esta placa.");
        }

        Integer clienteId = veiculo.getCliente().getId();

        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Cliente não encontrado."));

        veiculo.setPlaca(placa);
        veiculo.setCliente(cliente);

        try {
            return veiculoRepository.saveAndFlush(veiculo);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Não foi possível cadastrar o veículo. Verifique se a placa já existe.");
        }
    }

    @Transactional(readOnly = true)
    public List<Veiculo> listarTodos() {
        return veiculoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Veiculo buscarPorId(Integer id) {
        return veiculoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Veículo não encontrado."));
    }

    @Transactional(readOnly = true)
    public List<HistoricoManutencaoDTO> buscarHistorico(Integer veiculoId) {

        buscarPorId(veiculoId);

        List<OrdemServico> ordens = ordemServicoRepository
                .findByVeiculoIdOrderByDataEntradaDesc(veiculoId);

        List<HistoricoManutencaoDTO> historico = new ArrayList<>();

        for (OrdemServico ordem : ordens) {
            historico.add(new HistoricoManutencaoDTO(ordem));
        }

        return historico;
    }

    private void validarDados(Veiculo veiculo) {
        if (veiculo == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Os dados do veículo são obrigatórios.");
        }

        if (veiculo.getPlaca() == null ||
                veiculo.getPlaca().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A placa é obrigatória.");
        }

        if (veiculo.getCliente() == null ||
                veiculo.getCliente().getId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O cliente responsável é obrigatório.");
        }
    }

    private String normalizarPlaca(String placa) {
        return placa.trim()
                .replace("-", "")
                .toUpperCase(Locale.ROOT);
    }
}
