package com.gearflow.gearflow_system.Services;

import com.gearflow.gearflow_system.DTOs.Inspecao3DDTO;
import com.gearflow.gearflow_system.Models.*;
import com.gearflow.gearflow_system.Repositories.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
public class Inspecao3DService {
    private final OrdemServicoRepository ordens;
    private final AnotacaoInspecao3DRepository anotacoes;

    public Inspecao3DService(OrdemServicoRepository ordens, AnotacaoInspecao3DRepository anotacoes) {
        this.ordens = ordens;
        this.anotacoes = anotacoes;
    }

    private boolean funcionario(Authentication auth) {
        return auth != null && auth.isAuthenticated() && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_FUNCIONARIO".equals(a.getAuthority()));
    }

    private OrdemServico consultarOrdem(Integer id, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessão inválida");
        }
        OrdemServico os = ordens.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Ordem de serviço não encontrada"));
        if (!funcionario(auth)) {
            // O cliente pode visualizar SOMENTE a OS de um veículo vinculado ao seu e-mail.
            if (os.getVeiculo() == null || os.getVeiculo().getCliente() == null ||
                    os.getVeiculo().getCliente().getEmail() == null ||
                    !os.getVeiculo().getCliente().getEmail().equalsIgnoreCase(auth.getName())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Esta ordem não pertence à sua conta");
            }
        }
        return os;
    }

    private void exigirFuncionario(Authentication auth) {
        if (!funcionario(auth)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Somente a oficina pode registrar diagnósticos");
        }
    }

    @Transactional(readOnly = true)
    public Inspecao3DDTO.Resultado consultar(Integer id, Authentication auth) {
        OrdemServico os = consultarOrdem(id, auth);
        List<Inspecao3DDTO.Anotacao> dados = anotacoes
                .findByOrdemServicoIdOrderByCriadoEmAscIdAsc(id).stream()
                .map(Inspecao3DDTO.Anotacao::new).toList();
        return new Inspecao3DDTO.Resultado(os.getId(),
                os.getStatusOperac() == null ? null : os.getStatusOperac().name(),
                os.getVeiculo() == null ? null : new Inspecao3DDTO.VeiculoInfo(os.getVeiculo()),
                os.getObsDiag(), dados);
    }

    @Transactional
    public Inspecao3DDTO.Anotacao registrar(Integer id, Inspecao3DDTO.Criar dados, Authentication auth) {
        exigirFuncionario(auth);
        OrdemServico os = consultarOrdem(id, auth);
        if (dados == null || dados.regiao() == null || dados.gravidade() == null ||
                dados.titulo() == null || dados.titulo().isBlank() || dados.titulo().trim().length() > 100 ||
                dados.descricao() == null || dados.descricao().isBlank() || dados.descricao().trim().length() > 1500) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe região, gravidade, título e descrição válidos");
        }
        if (os.getStatusOperac() == StatusOperacional.FINALIZADA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A OS está finalizada e não aceita novos apontamentos");
        }
        AnotacaoInspecao3D nova = new AnotacaoInspecao3D(os, dados.regiao(), dados.gravidade(),
                dados.titulo().trim(), dados.descricao().trim());
        return new Inspecao3DDTO.Anotacao(anotacoes.saveAndFlush(nova));
    }

    @Transactional
    public Inspecao3DDTO.Anotacao atualizar(Integer id, Long anotacaoId, Inspecao3DDTO.Atualizar dados,
                                            Authentication auth) {
        exigirFuncionario(auth);
        consultarOrdem(id, auth);
        if (dados == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dados ausentes");
        AnotacaoInspecao3D anotacao = anotacoes.findById(anotacaoId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Apontamento não encontrado"));
        if (!id.equals(anotacao.getOrdemServico().getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Apontamento não pertence à OS");
        }
        anotacao.setResolvido(dados.resolvido());
        return new Inspecao3DDTO.Anotacao(anotacoes.save(anotacao));
    }
}
