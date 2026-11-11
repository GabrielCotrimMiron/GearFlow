package com.gearflow.gearflow_system.DTOs;

public record CriarManutencaoPreventivaDTO(
    Integer veiculoId,
    String descricao,
    Integer kmPrevista,
    Integer antecedenciaKm
) {}
