// A partir desta versão, a autenticação é feita por sessão HttpOnly.
// Arquivo legado mantido apenas para compatibilidade com módulos fora deste pacote.
export function salvarCredenciais() {}
export function obterCredenciais() { return true; }
export function limparCredenciais() {}
export function gerarAutorizacaoBasica() { return undefined; }
