
package com.gearflow.gearflow_system;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.gearflow.gearflow_system.Models.OrdemServico;
import com.gearflow.gearflow_system.Models.StatusOperacional;
import com.gearflow.gearflow_system.Models.Peca;

public class ImutabilidadeOrdemServicoTest {

    private void definirStatus(
            OrdemServico os,
            StatusOperacional status) {

        ReflectionTestUtils.setField(
                os, "statusOperac", status);
    }

    @Test
    void naoDeveAlterarOSFinalizada() {
        OrdemServico os = new OrdemServico();

        definirStatus(os, StatusOperacional.FINALIZADA);

        assertThrows(IllegalStateException.class, () -> {
            os.setObsDiag("Diagnostico alterado");
        });
    }

    @Test
    void naoDeveAdicionarItemEmOSFinalizada() {
        OrdemServico os = new OrdemServico();

        definirStatus(os, StatusOperacional.FINALIZADA);

        Peca peca = new Peca();

        assertThrows(IllegalStateException.class, () -> {
            os.adicionarItem(peca);
        });
    }

    @Test
    void devePermitirAlterarOSEmAndamento() {
        OrdemServico os = new OrdemServico();

        definirStatus(os, StatusOperacional.EM_EXECUCAO);

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

        definirStatus(os, StatusOperacional.FINALIZADA);

        assertThrows(IllegalStateException.class, () -> {
            peca.setValorUni(new BigDecimal("200.00"));
        });
    }
}
