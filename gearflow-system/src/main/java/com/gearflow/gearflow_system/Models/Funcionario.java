package com.gearflow.gearflow_system.Models;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Funcionario extends Usuario {

    private String matricula;
    private String nivelAcesso;

    public boolean verificarPermissao(String acao) {
        // Lógica para checar se o nível de acesso permite a ação
        return true;
    }
}