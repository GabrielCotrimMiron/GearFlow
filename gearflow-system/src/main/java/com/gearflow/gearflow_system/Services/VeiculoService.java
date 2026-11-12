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
import org.springframework.security.core.Authentication;
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
        validarQuilometragem(veiculo);

        if (veiculo.getId() != null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O ID não deve ser informado no cadastro.");
        }

        String placa = validarENormalizarPlaca(veiculo.getPlaca());
        Cliente cliente = temCliente(veiculo) ? resolverCliente(veiculo.getCliente()) : null;
        veiculo.setCliente(cliente);

        veiculo.setPlaca(placa);

        try {
            return veiculoRepository.saveAndFlush(veiculo);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Não foi possível cadastrar o veículo. Verifique se a placa já existe.");
        }
    }

    private boolean temCliente(Veiculo veiculo) {
        Cliente c = veiculo.getCliente();
        return c != null && (
                c.getId() != null ||
                        (c.getEmail() != null && !c.getEmail().isBlank())
        );
    }

    @Transactional(readOnly = true)
    public List<Veiculo> listarVeiculosDoCliente(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Cliente não autenticado.");
        }

        return veiculoRepository.findByClienteEmailIgnoreCaseOrderByIdDesc(
                authentication.getName());
    }

    @Transactional
    public Veiculo cadastrarVeiculoDoCliente(Veiculo veiculo, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Cliente não autenticado.");
        }

        if (veiculo == null || veiculo.getPlaca() == null || veiculo.getPlaca().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A placa do veículo é obrigatória.");
        }

        Cliente cliente = clienteRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Cadastro de cliente não encontrado para o usuário logado."));

        validarQuilometragem(veiculo);
        String placa = validarENormalizarPlaca(veiculo.getPlaca());

        veiculo.setId(null);
        veiculo.setPlaca(placa);
        veiculo.setCliente(cliente);

        return veiculoRepository.saveAndFlush(veiculo);
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
    public List<HistoricoManutencaoDTO> buscarHistorico(Integer veiculoId, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Autenticação necessária.");
        }
        Veiculo veiculo = buscarPorId(veiculoId);
        boolean funcionario = auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_FUNCIONARIO".equals(a.getAuthority()));
        if (!funcionario && (veiculo.getCliente() == null
                || !veiculo.getCliente().getEmail().equalsIgnoreCase(auth.getName()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Este veículo não pertence à sua conta.");
        }

        List<OrdemServico> ordens = ordemServicoRepository
                .findByVeiculoIdOrderByDataEntradaDesc(veiculoId);

        List<HistoricoManutencaoDTO> historico = new ArrayList<>();

        for (OrdemServico ordem : ordens) {
            historico.add(new HistoricoManutencaoDTO(ordem));
        }

        return historico;
    }

    private void validarQuilometragem(Veiculo veiculo) {
        if (veiculo.getKmAtual() != null && veiculo.getKmAtual() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A quilometragem não pode ser negativa.");
        }
    }

    private String validarENormalizarPlaca(String placaBruta) {
        String placa = normalizarPlaca(placaBruta);

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

        return placa;
    }

    @Transactional
    public Veiculo vincularCliente(Integer id, Cliente informado) {
        Veiculo v = buscarPorId(id);
        v.setCliente(resolverCliente(informado));
        return veiculoRepository.save(v);
    }

    private Cliente resolverCliente(Cliente clienteInformado) {
        if (clienteInformado.getId() != null) {
            return clienteRepository.findById(clienteInformado.getId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Cliente não encontrado pelo ID informado."));
        }

        if (clienteInformado.getEmail() != null && !clienteInformado.getEmail().isBlank()) {
            return clienteRepository.findByEmailIgnoreCase(clienteInformado.getEmail().trim())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Cliente não encontrado com o e-mail informado."));
        }

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Informe o ID ou o e-mail do cliente responsável.");
    }

    private void validarDados(Veiculo veiculo) {
        if (veiculo == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Os dados do veículo são obrigatórios.");
        }

        if (veiculo.getPlaca() == null || veiculo.getPlaca().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A placa é obrigatória.");
        }

        boolean temNome = veiculo.getNomeProprietario() != null
                && !veiculo.getNomeProprietario().isBlank();
        if (!temCliente(veiculo) && !temNome) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Informe o cliente (ID ou e-mail) ou o nome do proprietário.");
        }
    }

    private String normalizarPlaca(String placa) {
        return placa.trim()
                .replace("-", "")
                .toUpperCase(Locale.ROOT);
    }
}
