package com.gearflow.gearflow_system.DTOs;

public record AlertaPreventivoDTO(
    Integer id,
    Integer veiculoId,
    String veiculo,
    String placa,
    String descricao,
    Integer kmAtual,
    Integer kmPrevista,
    Integer kmRestantes,
    Integer antecedenciaKm,
    String situacao
) {}
