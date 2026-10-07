package com.gearflow.gearflow_system.Models;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public abstract class Usuario {
    private Integer id;
    private String nome;
    private String cpf;
    private String email;
    private String senha;

    public boolean autenticar(String senhaDigitada) {
        return this.senha != null && this.senha.equals(senhaDigitada);
    }

    public void alterarSenha(String novaSenha) {
        this.senha = novaSenha;
    }
}