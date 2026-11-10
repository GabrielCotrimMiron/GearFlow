
package com.gearflow.gearflow_system;

import com.gearflow.gearflow_system.DTOs.AcompanhamentoDTO;
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

class OrdemServicoServiceTest {

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

        // Simula um cliente autenticado.
        when(authentication.getName())
                .thenReturn("cliente@teste.com");

        when(authentication.isAuthenticated())
                .thenReturn(true);
    }

    @Test
    void deveRetornarAcompanhamentoDaPropriaOrdem() {
        Cliente cliente = new Cliente();
        cliente.setEmail("cliente@teste.com");

        Veiculo veiculo = new Veiculo();
        veiculo.setCliente(cliente);

        OrdemServico ordem = new OrdemServico();
        ordem.setVeiculo(veiculo);

        ReflectionTestUtils.setField(
                ordem,
                "statusOperac",
                StatusOperacional.EM_EXECUCAO);

        when(repository.findById(1))
                .thenReturn(Optional.of(ordem));

        AcompanhamentoDTO resultado =
                service.buscarAcompanhamento(1, authentication);

        assertNotNull(resultado);

        assertEquals(
                StatusOperacional.EM_EXECUCAO,
                resultado.getStatus());

        assertEquals(
                "Nao atribuido",
                resultado.getMecanicoResponsavel());
    }

    @Test
    void deveRetornar403QuandoOrdemPertenceAOutroCliente() {
        Cliente outroCliente = new Cliente();
        outroCliente.setEmail("outro@teste.com");

        Veiculo veiculo = new Veiculo();
        veiculo.setCliente(outroCliente);

        OrdemServico ordem = new OrdemServico();
        ordem.setVeiculo(veiculo);

        when(repository.findById(2))
                .thenReturn(Optional.of(ordem));

        ResponseStatusException erro = assertThrows(
                ResponseStatusException.class,
                () -> service.buscarAcompanhamento(
                        2, authentication));

        assertEquals(
                HttpStatus.FORBIDDEN,
                erro.getStatusCode());
    }

    @Test
    void deveRetornar404QuandoOrdemNaoExiste() {
        when(repository.findById(999))
                .thenReturn(Optional.empty());

        ResponseStatusException erro = assertThrows(
                ResponseStatusException.class,
                () -> service.buscarAcompanhamento(
                        999, authentication));

        assertEquals(
                HttpStatus.NOT_FOUND,
                erro.getStatusCode());
    }
}
