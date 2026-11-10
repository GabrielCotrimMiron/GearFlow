package com.gearflow.gearflow_system.Controllers;

import com.gearflow.gearflow_system.DTOs.ResumoFinanceiroDTO;
import com.gearflow.gearflow_system.Services.FinanceiroService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.gearflow.gearflow_system.DTOs.HistoricoFinanceiroDTO;
import java.util.List;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

import com.gearflow.gearflow_system.Models.Despesa;
import com.gearflow.gearflow_system.DTOs.ResultadoFinanceiroDTO;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/financeiro")
public class FinanceiroController {

    private final FinanceiroService financeiroService;

    public FinanceiroController(FinanceiroService financeiroService) {
        this.financeiroService = financeiroService;
    }

    @GetMapping("/resumo")
    public ResponseEntity<ResumoFinanceiroDTO> obterResumo() {

        ResumoFinanceiroDTO resumo = financeiroService.obterResumoFinanceiro();

        return ResponseEntity.ok(resumo);
    }

    @GetMapping("/historico")
    public ResponseEntity<List<HistoricoFinanceiroDTO>> obterHistorico() {
        return ResponseEntity.ok(
                financeiroService.obterHistoricoFinanceiro());
    }

    @PutMapping("/ordens/{id}/pagar")
    public ResponseEntity<Void> registrarPagamento(
            @PathVariable Integer id) {

        financeiroService.registrarPagamento(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/ordens/{id}/estornar")
    public ResponseEntity<Void> registrarEstorno(
            @PathVariable Integer id) {

        financeiroService.registrarEstorno(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/despesas")
    public ResponseEntity<Despesa> cadastrarDespesa(
            @RequestBody Despesa despesa) {

        return ResponseEntity.ok(
                financeiroService.cadastrarDespesa(despesa));
    }

    @GetMapping("/despesas")
    public ResponseEntity<List<Despesa>> listarDespesas() {

        return ResponseEntity.ok(
                financeiroService.listarDespesas());
    }

    @GetMapping("/resultado")
    public ResponseEntity<ResultadoFinanceiroDTO> obterResultado() {

        return ResponseEntity.ok(
                financeiroService.obterResultadoFinanceiro());
    }

}
