// Usado pelas poucas telas com fetch nativo; Axios inclui este token automaticamente.
export function cabecalhosCsrf() {
  const valor = document.cookie.split("; ").find(p => p.startsWith("XSRF-TOKEN="));
  return valor ? { "X-XSRF-TOKEN": decodeURIComponent(valor.split("=").slice(1).join("=")) } : {};
}
