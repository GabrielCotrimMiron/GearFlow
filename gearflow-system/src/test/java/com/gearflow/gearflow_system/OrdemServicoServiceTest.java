
package com.gearflow.gearflow_system;

import com.gearflow.gearflow_system.dto.AcompanhamentoDTO;
import com.gearflow.gearflow_system.model.Cliente;
import com.gearflow.gearflow_system.model.OrdemServico;
import com.gearflow.gearflow_system.model.StatusOperacional;
import com.gearflow.gearflow_system.model.Veiculo;
import com.gearflow.gearflow_system.repository.OrdemServicoRepository;
import com.gearflow.gearflow_system.service.OrdemServicoService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
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
        service = new OrdemServicoService(repository);

        when(authentication.getName())
                .thenReturn("cliente@teste.com");
    }

    @Test
    void deveRetornarAcompanhamentoDaPropriaOrdem() {
        Cliente cliente = new Cliente();
        cliente.setEmail("cliente@teste.com");

        Veiculo veiculo = new Veiculo();
        veiculo.setCliente(cliente);

        OrdemServico ordem = new OrdemServico();
        ordem.setVeiculo(veiculo);
        ordem.setStatusOperac(StatusOperacional.EM_EXECUCAO);

        when(repository.findById(1))
                .thenReturn(Optional.of(ordem));

        AcompanhamentoDTO resultado = service.buscarAcompanhamento(1, authentication);

        assertEquals(StatusOperacional.EM_EXECUCAO,
                resultado.getStatus());
        assertEquals("Nao atribuido",
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

        ResponseStatusException erro = assertThrows(ResponseStatusException.class,
                () -> service.buscarAcompanhamento(2, authentication));

        assertEquals(HttpStatus.FORBIDDEN,
                erro.getStatusCode());
    }

    @Test
    void deveRetornar404QuandoOrdemNaoExiste() {
        when(repository.findById(999))
                .thenReturn(Optional.empty());

        ResponseStatusException erro = assertThrows(ResponseStatusException.class,
                () -> service.buscarAcompanhamento(999, authentication));

        assertEquals(HttpStatus.NOT_FOUND,
                erro.getStatusCode());
    }
}
