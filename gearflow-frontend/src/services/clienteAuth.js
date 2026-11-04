let credenciais = null;

export function salvarCredenciais(email, senha) {
    credenciais = { email, senha };
}

export function obterCredenciais() {
    return credenciais;
}

export function limparCredenciais() {
    credenciais = null;
}

export function gerarAutorizacaoBasica() {
    if (!credenciais) {
        throw new Error('Cliente não autenticado.');
    }

    const valor = `${credenciais.email}:${credenciais.senha}`;

    const bytes = new TextEncoder().encode(valor);
    const binario = Array.from(bytes, byte => String.fromCharCode(byte)).join('');

    return `Basic ${btoa(binario)}`;
}
