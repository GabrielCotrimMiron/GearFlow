import api from "./api";

export async function consultarSessao() {
  try {
    const resposta = await api.get("/auth/session");
    return resposta.data;
  } catch (erro) {
    if (erro.response?.status === 401 || erro.response?.status === 403) return null;
    throw erro;
  }
}
export async function encerrarSessao() {
  await api.post("/auth/logout");
}
