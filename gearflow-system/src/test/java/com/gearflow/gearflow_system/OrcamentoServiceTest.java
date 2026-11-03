
package com.gearflow.gearflow_system;

import com.gearflow.gearflow_system.DTOs.OrcamentoDTO;
import com.gearflow.gearflow_system.Models.Cliente;
import com.gearflow.gearflow_system.Models.OrdemServico;
import com.gearflow.gearflow_system.Models.Veiculo;
import com.gearflow.gearflow_system.Repositories.OrdemServicoRepository;
import com.gearflow.gearflow_system.Services.OrdemServicoService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OrcamentoServiceTest {

    private OrdemServicoRepository repository;
    private OrdemServicoService service;

    @BeforeEach
    void configurar() {
        repository = mock(OrdemServicoRepository.class);
        service = new OrdemServicoService(repository);
    }

    private OrdemServico criarOrdem(String emailCliente) {
        Cliente cliente = mock(Cliente.class);
        Veiculo veiculo = mock(Veiculo.class);
        OrdemServico ordem = new OrdemServico();

        when(cliente.getEmail()).thenReturn(emailCliente);
        when(veiculo.getCliente()).thenReturn(cliente);

        ordem.setVeiculo(veiculo);

        return ordem;
    }

    private Authentication autenticar(String email) {
        return new UsernamePasswordAuthenticationToken(
                email,
                null,
                org.springframework.security.core.authority.AuthorityUtils
                        .createAuthorityList("ROLE_USER"));
    }

    @Test
    void clientePodeConsultarSeuOrcamento() {
        OrdemServico ordem = criarOrdem("cliente@teste.com");

        when(repository.findById(1)).thenReturn(Optional.of(ordem));

        OrcamentoDTO resultado = service.buscarOrcamento(
                1, autenticar("cliente@teste.com"));

        assertNotNull(resultado);
        assertEquals(0, resultado.itens().size());
        assertEquals(0, resultado.valorTotal().signum());
    }

    @Test
    void clienteNaoPodeConsultarOrcamentoDeOutroCliente() {
        OrdemServico ordem = criarOrdem("outro@teste.com");

        when(repository.findById(1)).thenReturn(Optional.of(ordem));

        ResponseStatusException erro = assertThrows(
                ResponseStatusException.class,
                () -> service.buscarOrcamento(
                        1, autenticar("cliente@teste.com")));

        assertEquals(HttpStatus.FORBIDDEN, erro.getStatusCode());
    }

    @Test
    void ordemInexistenteRetorna404() {
        when(repository.findById(999)).thenReturn(Optional.empty());

        ResponseStatusException erro = assertThrows(
                ResponseStatusException.class,
                () -> service.buscarOrcamento(
                        999, autenticar("cliente@teste.com")));

        assertEquals(HttpStatus.NOT_FOUND, erro.getStatusCode());
    }

    @Test
    void deveCalcularTotalDoOrcamentoComPecasEServicos() {
        OrdemServico ordem = criarOrdem("cliente@teste.com");

        com.gearflow.gearflow_system.Models.Peca peca = mock(com.gearflow.gearflow_system.Models.Peca.class);

        com.gearflow.gearflow_system.Models.Servico servico = mock(com.gearflow.gearflow_system.Models.Servico.class);

        when(peca.getId()).thenReturn(10);
        when(peca.getDescricao()).thenReturn("Filtro de oleo");
        when(peca.getQtd()).thenReturn(2);
        when(peca.getValorUni()).thenReturn(
                new java.math.BigDecimal("35.00"));

        when(servico.getId()).thenReturn(20);
        when(servico.getDescricao()).thenReturn("Troca de oleo");
        when(servico.getQtd()).thenReturn(1);
        when(servico.getValorUni()).thenReturn(
                new java.math.BigDecimal("80.00"));

        ordem.adicionarItem(peca);
        ordem.adicionarItem(servico);

        when(repository.findById(1)).thenReturn(Optional.of(ordem));

        OrcamentoDTO resultado = service.buscarOrcamento(
                1, autenticar("cliente@teste.com"));

        assertEquals(2, resultado.itens().size());

        assertEquals(
                0,
                new java.math.BigDecimal("150.00")
                        .compareTo(resultado.valorTotal()));

        assertEquals("PECA", resultado.itens().get(0).tipo());
        assertEquals("SERVICO", resultado.itens().get(1).tipo());
    }

}
