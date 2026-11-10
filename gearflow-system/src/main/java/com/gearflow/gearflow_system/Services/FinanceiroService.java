package com.gearflow.gearflow_system.Services;

import com.gearflow.gearflow_system.DTOs.ResumoFinanceiroDTO;
import com.gearflow.gearflow_system.Models.OrdemServico;
import com.gearflow.gearflow_system.Models.StatusOperacional;
import com.gearflow.gearflow_system.Models.StatusPagamento;
import com.gearflow.gearflow_system.Repositories.OrdemServicoRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.gearflow.gearflow_system.DTOs.HistoricoFinanceiroDTO;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.gearflow.gearflow_system.Models.Despesa;
import com.gearflow.gearflow_system.Repositories.DespesaRepository;
import com.gearflow.gearflow_system.DTOs.ResultadoFinanceiroDTO;

@Service
public class FinanceiroService {

    private final OrdemServicoRepository ordemServicoRepository;
    private final DespesaRepository despesaRepository;

    public FinanceiroService(
            OrdemServicoRepository ordemServicoRepository,
            DespesaRepository despesaRepository) {

        this.ordemServicoRepository = ordemServicoRepository;
        this.despesaRepository = despesaRepository;
    }

    @Transactional(readOnly = true)
    public ResumoFinanceiroDTO obterResumoFinanceiro() {

        List<OrdemServico> ordens = ordemServicoRepository.findAll();

        BigDecimal faturamentoFinalizado = BigDecimal.ZERO;
        BigDecimal totalPago = BigDecimal.ZERO;
        BigDecimal totalPendente = BigDecimal.ZERO;
        BigDecimal totalEstornado = BigDecimal.ZERO;

        long quantidadeOSFinalizadas = 0;
        long quantidadeOSPagas = 0;
        long quantidadeOSPendentes = 0;

        for (OrdemServico ordem : ordens) {

            if (ordem.getStatusOperac() != StatusOperacional.FINALIZADA) {
                continue;
            }

            quantidadeOSFinalizadas++;

            BigDecimal valor = ordem.calcularTotalComDesconto();

            faturamentoFinalizado = faturamentoFinalizado.add(valor);

            StatusPagamento status = ordem.getStatusPag();

            if (status == StatusPagamento.PAGO) {

                totalPago = totalPago.add(valor);
                quantidadeOSPagas++;

            } else if (status == StatusPagamento.ESTORNADO) {

                totalEstornado = totalEstornado.add(valor);

            } else {

                // Inclui PENDENTE e status ainda não informado.
                totalPendente = totalPendente.add(valor);
                quantidadeOSPendentes++;
            }
        }

        return new ResumoFinanceiroDTO(
                faturamentoFinalizado,
                totalPago,
                totalPendente,
                totalEstornado,
                quantidadeOSFinalizadas,
                quantidadeOSPagas,
                quantidadeOSPendentes);
    }

    @Transactional(readOnly = true)
    public List<HistoricoFinanceiroDTO> obterHistoricoFinanceiro() {

        return ordemServicoRepository.findAll()
                .stream()
                .filter(os -> os.getStatusOperac() == StatusOperacional.FINALIZADA)
                .map(os -> new HistoricoFinanceiroDTO(
                        os.getId(),
                        os.getDataEntrada(),
                        os.getStatusOperac().name(),
                        os.getStatusPag() == null
                                ? "PENDENTE"
                                : os.getStatusPag().name(),
                        os.calcularTotalComDesconto()))
                .sorted((a, b) -> {
                    if (a.dataEntrada() == null)
                        return 1;
                    if (b.dataEntrada() == null)
                        return -1;
                    return b.dataEntrada().compareTo(a.dataEntrada());
                })
                .toList();
    }

    @Transactional
    public void registrarPagamento(Integer osId) {

        OrdemServico ordem = ordemServicoRepository.findById(osId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Ordem de servico nao encontrada"));

        if (ordem.getStatusOperac() != StatusOperacional.FINALIZADA) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Somente ordens finalizadas podem receber pagamentos");
        }

        if (ordem.getStatusPag() == StatusPagamento.PAGO ||
                ordem.getStatusPag() == StatusPagamento.ESTORNADO) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Esta ordem ja foi paga ou estornada");
        }

        ordem.setStatusPag(StatusPagamento.PAGO);
        ordemServicoRepository.save(ordem);
    }

    @Transactional
    public void registrarEstorno(Integer osId) {

        OrdemServico ordem = ordemServicoRepository.findById(osId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Ordem de servico nao encontrada"));

        if (ordem.getStatusOperac() != StatusOperacional.FINALIZADA) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Somente ordens finalizadas podem ser estornadas");
        }

        if (ordem.getStatusPag() != StatusPagamento.PAGO) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Somente ordens pagas podem ser estornadas");
        }

        ordem.setStatusPag(StatusPagamento.ESTORNADO);
        ordemServicoRepository.save(ordem);
    }

    @Transactional
    public Despesa cadastrarDespesa(Despesa despesa) {

        if (despesa.getDescricao() == null ||
                despesa.getDescricao().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe a descricao da despesa");
        }

        if (despesa.getValor() == null ||
                despesa.getValor().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O valor da despesa deve ser maior que zero");
        }

        despesa.setId(null);
        despesa.setDescricao(despesa.getDescricao().trim());

        return despesaRepository.save(despesa);
    }

    @Transactional(readOnly = true)
    public List<Despesa> listarDespesas() {
        return despesaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public ResultadoFinanceiroDTO obterResultadoFinanceiro() {

        BigDecimal totalRecebido = ordemServicoRepository.findAll()
                .stream()
                .filter(os -> os.getStatusOperac() == StatusOperacional.FINALIZADA &&
                        os.getStatusPag() == StatusPagamento.PAGO)
                .map(OrdemServico::calcularTotalComDesconto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalDespesas = despesaRepository.findAll()
                .stream()
                .map(Despesa::getValor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new ResultadoFinanceiroDTO(
                totalRecebido,
                totalDespesas,
                totalRecebido.subtract(totalDespesas));
    }

}
