package com.gearflow.gearflow_system;

import com.gearflow.gearflow_system.DTOs.FuncionarioDTO;
import com.gearflow.gearflow_system.Models.*;
import com.gearflow.gearflow_system.Repositories.*;
import com.gearflow.gearflow_system.Services.*;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Casos de regressao dos erros encontrados na revisao final. */
class RevisaoFinalTest {

    @Test
    void cadastroFuncionarioMantemSenhaCpfEPapel() {
        FuncionarioRepository repo = mock(FuncionarioRepository.class);
        when(repo.saveAndFlush(any(Funcionario.class))).thenAnswer(chamada -> {
            Funcionario f = chamada.getArgument(0);
            f.setId(7);
            return f;
        });
        when(repo.save(any(Funcionario.class))).thenAnswer(chamada -> chamada.getArgument(0));
        UsuarioRepository usuarios = mock(UsuarioRepository.class);
        FuncionarioDTO dto = new FuncionarioDTO();
        dto.setNome("Teste");
        dto.setEmail("teste@exemplo.com");
        dto.setSenha("senha-teste");
        dto.setCpf("12345678900");
        dto.setNivelAcesso(NivelAcesso.GERENTE);
        Funcionario salvo = new FuncionarioService(repo, usuarios).cadastrarMecanico(dto);
        assertEquals("senha-teste", salvo.getSenha());
        assertEquals("12345678900", salvo.getCpf());
        assertEquals("GERENTE", salvo.getNivelAcesso().name());
        assertEquals("0007", salvo.getMatricula());
    }

    @Test
    void finalizarSoDepoisDaAprovacao() {
        OrdemServico os = new OrdemServico();
        os.setStatusOperac(StatusOperacional.EM_ANALISE);
        assertThrows(IllegalStateException.class, os::finalizar);
        os.avancarStatus(StatusOperacional.AGUARDANDO_APROVACAO);
        os.aprovarOrcamento();
        os.finalizar();
        assertEquals(StatusOperacional.FINALIZADA, os.getStatusOperac());
        assertEquals(StatusPagamento.PENDENTE, os.getStatusPag());
        assertThrows(IllegalStateException.class, () -> os.setObsDiag("Alterar depois de fechar"));
    }

    @Test
    void totalMonetarioNaoPerdeCentavos() {
        OrdemServico os = new OrdemServico();
        Peca peca = new Peca();
        peca.setValorUni(new BigDecimal("0.10"));
        peca.setQtd(3);
        os.adicionarItem(peca);
        assertEquals(0, new BigDecimal("0.30").compareTo(os.calcularTotalPreciso()));
    }

    @Test
    void bloqueioDeOSOcorreAntesDeBuscarItemOuAbaterEstoque() {
        OrdemServicoRepository ordens = mock(OrdemServicoRepository.class);
        ItemOSRepository itens = mock(ItemOSRepository.class);
        OrdemServicoService service = new OrdemServicoService(itens, ordens,
                mock(VeiculoRepository.class), mock(FuncionarioRepository.class));
        OrdemServico os = new OrdemServico();
        os.setStatusOperac(StatusOperacional.EM_ANALISE);
        os.avancarStatus(StatusOperacional.AGUARDANDO_APROVACAO);
        when(ordens.findById(12)).thenReturn(Optional.of(os));
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.adicionarItem(12, 20, 2));
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        verifyNoInteractions(itens);
    }

    @Test
    void naoExibeHistoricoDeVeiculoDeOutroCliente() {
        VeiculoRepository veiculos = mock(VeiculoRepository.class);
        Cliente cliente = new Cliente();
        cliente.setEmail("dono@exemplo.com");
        Veiculo veiculo = new Veiculo();
        veiculo.setCliente(cliente);
        when(veiculos.findById(5)).thenReturn(Optional.of(veiculo));
        VeiculoService service = new VeiculoService(veiculos, mock(ClienteRepository.class),
                mock(OrdemServicoRepository.class));
        var auth = new UsernamePasswordAuthenticationToken("outro@exemplo.com", null,
                AuthorityUtils.createAuthorityList("ROLE_USER"));
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.buscarHistorico(5, auth));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void filaOrganizaUrgenteAntesDeNormal() {
        OrdemServicoRepository ordens = mock(OrdemServicoRepository.class);
        OrdemServico normal = new OrdemServico();
        normal.setPrioridade(PrioridadeOS.NORMAL);
        OrdemServico urgente = new OrdemServico();
        urgente.setPrioridade(PrioridadeOS.URGENTE);
        when(ordens.findAll()).thenReturn(List.of(normal, urgente));
        OrdemServicoService service = new OrdemServicoService(mock(ItemOSRepository.class), ordens,
                mock(VeiculoRepository.class), mock(FuncionarioRepository.class));
        assertEquals("URGENTE", service.listarFilaPrioridade().getFirst().prioridade());
    }
}
