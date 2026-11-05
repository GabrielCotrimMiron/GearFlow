
package com.gearflow.gearflow_system.Controllers;

import com.gearflow.gearflow_system.DTOs.AcompanhamentoDTO;
import com.gearflow.gearflow_system.DTOs.FilaPrioridadeDTO;
import com.gearflow.gearflow_system.DTOs.OrcamentoDTO;
import com.gearflow.gearflow_system.DTOs.OrdemServicoGestaoDTO;
import com.gearflow.gearflow_system.DTOs.OrdemServicoResumoDTO;
import com.gearflow.gearflow_system.Models.PrioridadeOS;
import com.gearflow.gearflow_system.Models.OrdemServico;
import com.gearflow.gearflow_system.Services.OrdemServicoService;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/ordens-servico")
public class OrdemServicoController {

    private final OrdemServicoService ordemServicoService;

    public OrdemServicoController(
            OrdemServicoService ordemServicoService) {
        this.ordemServicoService = ordemServicoService;
    }

    // Cadastro de nova Ordem de Servico
    public record CriarOrdemServicoRequest(
            Integer veiculoId,
            Integer funcionarioId,
            LocalDate dataEntrada,
            LocalDate previsaoEntrega,
            PrioridadeOS prioridade,
            String obsDiag
    ) {}

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrdemServicoGestaoDTO criarOrdemServico(
            @RequestBody CriarOrdemServicoRequest request) {

        OrdemServico ordem = ordemServicoService.criarOrdemServico(
                request.veiculoId(),
                request.funcionarioId(),
                request.dataEntrada(),
                request.previsaoEntrega(),
                request.prioridade(),
                request.obsDiag()
        );

        return new OrdemServicoGestaoDTO(ordem);
    }

    // RF05 - Consultar fila de prioridade
    @GetMapping("/fila-prioridade")
    public List<FilaPrioridadeDTO> listarFilaPrioridade() {
        return ordemServicoService.listarFilaPrioridade();
    }

    // RF05 - Alterar prioridade de uma OS
    @PutMapping("/{id}/prioridade")
    public void alterarPrioridade(
            @PathVariable Integer id,
            @RequestParam PrioridadeOS prioridade) {

        ordemServicoService.alterarPrioridade(id, prioridade);
    }

    // RF12 - Acompanhamento da OS
    @GetMapping("/{id}/acompanhamento")
    public AcompanhamentoDTO buscarAcompanhamento(
            @PathVariable Integer id,
            Authentication authentication) {

        return ordemServicoService.buscarAcompanhamento(
                id, authentication);
    }

    // RF13 - Visualizacao do orcamento
    @GetMapping("/{id}/orcamento")
    public OrcamentoDTO buscarOrcamento(
            @PathVariable Integer id,
            Authentication authentication) {

        return ordemServicoService.buscarOrcamento(
                id, authentication);
    }

    @GetMapping("/minhas")
    public List<OrdemServicoResumoDTO> listarMinhasOrdens(
            Authentication authentication) {

        return ordemServicoService.listarOrdensDoCliente(
                authentication);
    }

    // RF09 - Fechamento de Rascunho
    @PutMapping("/{id}/fechar-rascunho")
    public void fecharRascunho(
            @PathVariable Integer id,
            @RequestParam BigDecimal desconto) {

        ordemServicoService.fecharRascunho(id, desconto);
    }

    // Listagem de ordens para a gestao
    @GetMapping
    public List<OrdemServicoGestaoDTO> listarOrdens() {
        return ordemServicoService.listarTodas();
    }
}
