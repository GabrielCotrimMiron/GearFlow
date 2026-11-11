package com.gearflow.gearflow_system.Services;

import com.gearflow.gearflow_system.DTOs.AlertaPreventivoDTO;
import com.gearflow.gearflow_system.DTOs.CriarManutencaoPreventivaDTO;
import com.gearflow.gearflow_system.Models.ManutencaoPreventiva;
import com.gearflow.gearflow_system.Models.Veiculo;
import com.gearflow.gearflow_system.Repositories.ManutencaoPreventivaRepository;
import com.gearflow.gearflow_system.Repositories.VeiculoRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AlertaPreventivoService {
    private final ManutencaoPreventivaRepository repository;
    private final VeiculoRepository veiculoRepository;

    public AlertaPreventivoService(ManutencaoPreventivaRepository repository,
                                  VeiculoRepository veiculoRepository) {
        this.repository = repository;
        this.veiculoRepository = veiculoRepository;
    }

    private String email(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || auth.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Autenticação necessária.");
        }
        return auth.getName();
    }

    private AlertaPreventivoDTO converter(ManutencaoPreventiva m) {
        Veiculo v = m.getVeiculo();
        Integer atual = v.getKmAtual();
        Integer restante = atual == null ? null : m.getKmPrevista() - atual;
        String situacao = restante == null ? "SEM_QUILOMETRAGEM"
            : restante < 0 ? "VENCIDA"
            : restante == 0 ? "ATINGIDA"
            : restante <= m.getAntecedenciaKm() ? "PROXIMA" : "EM_DIA";
        return new AlertaPreventivoDTO(m.getId(), v.getId(),
            (v.getMarca() == null ? "" : v.getMarca() + " ") + (v.getModelo() == null ? "" : v.getModelo()),
            v.getPlaca(), m.getDescricao(), atual, m.getKmPrevista(), restante,
            m.getAntecedenciaKm(), situacao);
    }

    @Transactional(readOnly = true)
    public List<AlertaPreventivoDTO> meusAlertas(Authentication auth) {
        return repository.findByVeiculoClienteEmailIgnoreCaseAndAtivaTrueOrderByKmPrevistaAsc(email(auth))
            .stream().map(this::converter).toList();
    }

    @Transactional
    public AlertaPreventivoDTO cadastrar(CriarManutencaoPreventivaDTO dto, Authentication auth) {
        String usuario = email(auth);
        if (dto == null || dto.veiculoId() == null || dto.descricao() == null || dto.descricao().isBlank()
                || dto.descricao().trim().length() > 120 || dto.kmPrevista() == null || dto.kmPrevista() < 0
                || (dto.antecedenciaKm() != null && (dto.antecedenciaKm() < 0 || dto.antecedenciaKm() > 100000))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dados de manutenção inválidos.");
        }
        Veiculo veiculo = veiculoRepository.findById(dto.veiculoId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Veículo não encontrado."));
        if (veiculo.getCliente() == null || veiculo.getCliente().getEmail() == null
                || !veiculo.getCliente().getEmail().equalsIgnoreCase(usuario)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Veículo não pertence ao cliente autenticado.");
        }
        ManutencaoPreventiva manutencao = new ManutencaoPreventiva();
        manutencao.setVeiculo(veiculo);
        manutencao.setDescricao(dto.descricao().trim());
        manutencao.setKmPrevista(dto.kmPrevista());
        manutencao.setAntecedenciaKm(dto.antecedenciaKm() == null ? 1000 : dto.antecedenciaKm());
        return converter(repository.save(manutencao));
    }

    @Transactional
    public void desativar(Integer id, Authentication auth) {
        String usuario = email(auth);
        ManutencaoPreventiva m = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Manutenção não encontrada."));
        if (m.getVeiculo().getCliente() == null || m.getVeiculo().getCliente().getEmail() == null
                || !m.getVeiculo().getCliente().getEmail().equalsIgnoreCase(usuario)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado.");
        }
        m.setAtiva(false);
    }
}
