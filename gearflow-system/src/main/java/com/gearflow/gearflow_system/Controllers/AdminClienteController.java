package com.gearflow.gearflow_system.Controllers;

import com.gearflow.gearflow_system.DTOs.ClienteAdminDTO;
import com.gearflow.gearflow_system.DTOs.ClienteAdminFormulario;
import com.gearflow.gearflow_system.Models.Cliente;
import com.gearflow.gearflow_system.Repositories.ClienteRepository;
import com.gearflow.gearflow_system.Repositories.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

/** Proteção obrigatória configurada em SecurityConfig: ROLE_GERENTE. */
@RestController
@RequestMapping("/admin/clientes")
public class AdminClienteController {
    private final ClienteRepository clientes;
    private final UsuarioRepository usuarios;

    public AdminClienteController(ClienteRepository clientes, UsuarioRepository usuarios) {
        this.clientes = clientes;
        this.usuarios = usuarios;
    }

    private ClienteAdminDTO resposta(Cliente c) {
        return new ClienteAdminDTO(c.getId(), c.getNome(), c.getEmail(), c.getCpf(),
                c.getTelefone(), c.getVeiculos() == null ? 0 : c.getVeiculos().size());
    }

    private Cliente encontrar(Integer id) {
        return clientes.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente não encontrado."));
    }

    private String obrigatorio(String valor, String campo) {
        if (valor == null || valor.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, campo + " é obrigatório.");
        return valor.trim();
    }

    private void verificarEmail(String email, Integer idAtual) {
        usuarios.findByEmail(email).ifPresent(u -> {
            if (idAtual == null || !u.getId().equals(idAtual))
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Este e-mail já está cadastrado.");
        });
    }

    @GetMapping("/acesso")
    public java.util.Map<String, Boolean> acesso() {
        return java.util.Map.of("autorizado", true);
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<ClienteAdminDTO> listar() {
        return clientes.findAll().stream()
                .sorted(Comparator.comparing(c -> c.getNome() == null ? "" : c.getNome(),
                        String.CASE_INSENSITIVE_ORDER))
                .map(this::resposta).toList();
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ClienteAdminDTO detalhar(@PathVariable Integer id) {
        return resposta(encontrar(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ClienteAdminDTO adicionar(@RequestBody ClienteAdminFormulario f) {
        String nome = obrigatorio(f.nome(), "Nome");
        String email = obrigatorio(f.email(), "E-mail").toLowerCase(Locale.ROOT);
        String senha = obrigatorio(f.senha(), "Senha inicial");
        verificarEmail(email, null);
        Cliente c = new Cliente();
        c.setNome(nome);
        c.setEmail(email);
        c.setCpf(obrigatorio(f.cpf(), "CPF"));
        c.setTelefone(obrigatorio(f.telefone(), "Telefone"));
        // Compatível com a autenticação local atual (NoOp). Migrar para BCrypt antes da
        // produção.
        c.setSenha(senha);
        return resposta(clientes.save(c));
    }

    @PutMapping("/{id}")
    @Transactional
    public ClienteAdminDTO editar(@PathVariable Integer id, @RequestBody ClienteAdminFormulario f) {
        Cliente c = encontrar(id);
        String email = obrigatorio(f.email(), "E-mail").toLowerCase(Locale.ROOT);
        verificarEmail(email, id);
        c.setNome(obrigatorio(f.nome(), "Nome"));
        c.setEmail(email);
        c.setCpf(obrigatorio(f.cpf(), "CPF"));
        c.setTelefone(obrigatorio(f.telefone(), "Telefone"));
        if (f.senha() != null && !f.senha().isBlank())
            c.setSenha(f.senha());
        return resposta(clientes.save(c));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public String conflitoDependencias() {
        return "Não é possível excluir ou alterar: existem registros vinculados ou valores duplicados.";
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void remover(@PathVariable Integer id) {
        Cliente c = encontrar(id);
        if (c.getVeiculos() != null && !c.getVeiculos().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cliente possui veículos vinculados. Desvincule-os antes de excluir o cadastro.");
        }
        // Outras relações no banco também podem impedir a exclusão por integridade
        // referencial.
        clientes.delete(c);
        clientes.flush();
    }
}
