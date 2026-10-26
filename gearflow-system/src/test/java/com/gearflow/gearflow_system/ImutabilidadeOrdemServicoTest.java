package com.gearflow.gearflow_system;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

import com.gearflow.gearflow_system.Models.OrdemServico;
import com.gearflow.gearflow_system.Models.StatusOperacional;
import com.gearflow.gearflow_system.Models.Peca;

public class ImutabilidadeOrdemServicoTest {

    @Test
    void naoDeveAlterarOSFinalizada() {
        OrdemServico os = new OrdemServico();

        os.setStatusOperac(StatusOperacional.FINALIZADA);

        assertThrows(IllegalStateException.class, () -> {
            os.setObsDiag("Diagnostico alterado");
        });
    }

    @Test
    void naoDeveAdicionarItemEmOSFinalizada() {
        OrdemServico os = new OrdemServico();

        os.setStatusOperac(StatusOperacional.FINALIZADA);

        Peca peca = new Peca();

        assertThrows(IllegalStateException.class, () -> {
            os.adicionarItem(peca);
        });
    }

    @Test
    void devePermitirAlterarOSEmAndamento() {
        OrdemServico os = new OrdemServico();

        os.setStatusOperac(StatusOperacional.EM_EXECUCAO);
        os.setObsDiag("Manutencao em andamento");

        assertEquals(
                "Manutencao em andamento",
                os.getObsDiag());
    }

    @Test
    void naoDeveAlterarPrecoDeItemEmOSFinalizada() {
        OrdemServico os = new OrdemServico();
        Peca peca = new Peca();

        os.adicionarItem(peca);
        os.setStatusOperac(StatusOperacional.FINALIZADA);

        assertThrows(IllegalStateException.class, () -> {
            peca.setValorUni(new java.math.BigDecimal("200.00"));
        });
    }
}