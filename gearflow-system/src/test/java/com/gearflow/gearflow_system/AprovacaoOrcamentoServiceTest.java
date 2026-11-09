
package com.gearflow.gearflow_system;

import com.gearflow.gearflow_system.Models.Cliente;
import com.gearflow.gearflow_system.Models.OrdemServico;
import com.gearflow.gearflow_system.Models.StatusOperacional;
import com.gearflow.gearflow_system.Models.Veiculo;

import com.gearflow.gearflow_system.Repositories.FuncionarioRepository;
import com.gearflow.gearflow_system.Repositories.ItemOSRepository;
import com.gearflow.gearflow_system.Repositories.OrdemServicoRepository;
import com.gearflow.gearflow_system.Repositories.VeiculoRepository;
import com.gearflow.gearflow_system.Services.OrdemServicoService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AprovacaoOrcamentoServiceTest {

    private OrdemServicoRepository repository;
    private OrdemServicoService service;
    private Authentication authentication;

    @BeforeEach
    void preparar() {
        repository = mock(OrdemServicoRepository.class);
        authentication = mock(Authentication.class);

        ItemOSRepository itemOSRepository =
                mock(ItemOSRepository.class);

        VeiculoRepository veiculoRepository =
                mock(VeiculoRepository.class);

        FuncionarioRepository funcionarioRepository =
                mock(FuncionarioRepository.class);

        service = new OrdemServicoService(
                itemOSRepository,
                repository,
                veiculoRepository,
                funcionarioRepository);

        when(authentication.getName())
                .thenReturn("cliente@teste.com");

        when(authentication.isAuthenticated())
                .thenReturn(true);
    }

    private OrdemServico criarOrdem(
            String emailCliente,
            StatusOperacional status) {

        Cliente cliente = new Cliente();
        cliente.setEmail(emailCliente);

        Veiculo veiculo = new Veiculo();
        veiculo.setCliente(cliente);

        OrdemServico ordem = new OrdemServico();
        ordem.setVeiculo(veiculo);

        ReflectionTestUtils.setField(
                ordem, "statusOperac", status);

        return ordem;
    }

    @Test
    void deveAprovarOrcamentoDoProprioCliente() {
        OrdemServico ordem = criarOrdem(
                "cliente@teste.com",
                StatusOperacional.AGUARDANDO_APROVACAO);

        when(repository.findById(1))
                .thenReturn(Optional.of(ordem));

        service.aprovarOrcamento(1, authentication);

        assertEquals(
                StatusOperacional.EM_EXECUCAO,
                ordem.getStatusOperac());

        verify(repository).save(ordem);
    }

    @Test
    void deveRejeitarOrcamentoDoProprioCliente() {
        OrdemServico ordem = criarOrdem(
                "cliente@teste.com",
                StatusOperacional.AGUARDANDO_APROVACAO);

        when(repository.findById(2))
                .thenReturn(Optional.of(ordem));

        service.rejeitarOrcamento(2, authentication);

        assertEquals(
                StatusOperacional.ORCAMENTO_REJEITADO,
                ordem.getStatusOperac());

        verify(repository).save(ordem);
    }

    @Test
    void naoDeveAprovarOrcamentoDeOutroCliente() {
        OrdemServico ordem = criarOrdem(
                "outro@teste.com",
                StatusOperacional.AGUARDANDO_APROVACAO);

        when(repository.findById(3))
                .thenReturn(Optional.of(ordem));

        ResponseStatusException erro = assertThrows(
                ResponseStatusException.class,
                () -> service.aprovarOrcamento(
                        3, authentication));

        assertEquals(
                HttpStatus.FORBIDDEN,
                erro.getStatusCode());

        verify(repository, never()).save(any());
    }

    @Test
    void naoDeveAprovarOrcamentoDuasVezes() {
        OrdemServico ordem = criarOrdem(
                "cliente@teste.com",
                StatusOperacional.AGUARDANDO_APROVACAO);

        when(repository.findById(4))
                .thenReturn(Optional.of(ordem));

        service.aprovarOrcamento(4, authentication);

        ResponseStatusException erro = assertThrows(
                ResponseStatusException.class,
                () -> service.aprovarOrcamento(
                        4, authentication));

        assertEquals(
                HttpStatus.CONFLICT,
                erro.getStatusCode());

        verify(repository, times(1)).save(ordem);
    }

    @Test
    void naoDeveAprovarOrdemEmAnalise() {
        OrdemServico ordem = criarOrdem(
                "cliente@teste.com",
                StatusOperacional.EM_ANALISE);

        when(repository.findById(5))
                .thenReturn(Optional.of(ordem));

        ResponseStatusException erro = assertThrows(
                ResponseStatusException.class,
                () -> service.aprovarOrcamento(
                        5, authentication));

        assertEquals(
                HttpStatus.CONFLICT,
                erro.getStatusCode());

        verify(repository, never()).save(any());
    }

    @Test
    void naoDeveRejeitarOrdemEmExecucao() {
        OrdemServico ordem = criarOrdem(
                "cliente@teste.com",
                StatusOperacional.EM_EXECUCAO);

        when(repository.findById(6))
                .thenReturn(Optional.of(ordem));

        ResponseStatusException erro = assertThrows(
                ResponseStatusException.class,
                () -> service.rejeitarOrcamento(
                        6, authentication));

        assertEquals(
                HttpStatus.CONFLICT,
                erro.getStatusCode());

        verify(repository, never()).save(any());
    }
}
