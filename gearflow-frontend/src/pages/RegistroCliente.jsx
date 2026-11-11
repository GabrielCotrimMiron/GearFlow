import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Fingerprint,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
  UserRoundPlus,
  Wrench,
} from "lucide-react";
import api from "../services/api";
import AuthVisual from "./AuthVisual";
import "./AuthPages.css";
import "./RegistroClienteAjustes.css";

const soDigitos = (valor) => valor.replace(/\D/g, "");
function mascaraCPF(valor) {
  const n = soDigitos(valor).slice(0, 11);
  return n
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}
function mascaraTelefone(valor) {
  const n = soDigitos(valor).slice(0, 11);
  if (n.length <= 2) return n.length ? `(${n}` : "";
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10)
    return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}
function cpfValido(valor) {
  const cpf = soDigitos(valor);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  for (let t = 9; t < 11; t++) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += Number(cpf[i]) * (t + 1 - i);
    const digito = ((soma * 10) % 11) % 10;
    if (digito !== Number(cpf[t])) return false;
  }
  return true;
}
const inicial = {
  nome: "",
  email: "",
  cpf: "",
  telefone: "",
  senha: "",
  confirmarSenha: "",
};

export default function RegistroCliente() {
  const navigate = useNavigate();
  const [form, setForm] = useState(inicial);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const atualizar = (nome, valor) =>
    setForm((prev) => ({ ...prev, [nome]: valor }));
  const senhaValida = form.senha.length >= 8;
  const senhasIguais = form.senha !== "" && form.senha === form.confirmarSenha;

  async function cadastrar(evento) {
    evento.preventDefault();
    if (enviando) return;
    setErro("");
    if (form.nome.trim().split(/\s+/).length < 2)
      return setErro("Informe seu nome e sobrenome.");
    if (!cpfValido(form.cpf)) return setErro("Digite um CPF válido.");
    if (soDigitos(form.telefone).length < 10)
      return setErro("Digite um telefone com DDD válido.");
    if (!senhaValida)
      return setErro("Sua senha precisa ter pelo menos 8 caracteres.");
    if (!senhasIguais) return setErro("As senhas digitadas não coincidem.");
    setEnviando(true);
    try {
      await api.post("/clientes/registro", {
        nome: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        cpf: soDigitos(form.cpf),
        telefone: soDigitos(form.telefone),
        senha: form.senha,
      });
      navigate("/", { replace: true, state: { registroCriado: true } });
    } catch (e) {
      if (e.response?.status === 409)
        setErro(
          "Já existe um cadastro com esses dados. Tente entrar na sua conta.",
        );
      else if (e.response?.status === 400)
        setErro(
          "O servidor recusou os dados. Revise as informações e tente novamente.",
        );
      else
        setErro(
          "Não foi possível criar sua conta. Confira os dados e a conexão com o servidor.",
        );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="gf-auth-page gf-auth-register-page">
      <AuthVisual cadastro />
      <section className="gf-auth-form-side">
        <div className="gf-auth-mobile-brand">
          <Wrench size={20} />{" "}
          <span>
            gear<strong>flow</strong>
          </span>
        </div>
        <div className="gf-auth-form-shell gf-auth-register-shell">
          <div className="gf-register-topbar">
            <Link to="/" className="gf-auth-back gf-register-back">
              <ArrowLeft size={16} /> Voltar para login
            </Link>
          </div>
          <div className="gf-register-heading">
            <div className="gf-register-heading-icon" aria-hidden="true">
              <UserRoundPlus size={25} strokeWidth={1.8} />
            </div>
            <div className="gf-register-heading-copy">
              <span className="gf-register-heading-eyebrow">
                CADASTRO DE CLIENTE
              </span>
              <h2>
                Comece por <span>aqui.</span>
              </h2>
            </div>
          </div>
          <p className="gf-auth-lead">
            Preencha seus dados para acompanhar seu veículo com mais facilidade.
          </p>
          <div className="gf-auth-progress">
            <span className="active">
              <Check size={13} /> Dados pessoais
            </span>
            <span className="gf-auth-progress-line" />
            <span className={senhaValida && senhasIguais ? "active" : ""}>
              <LockKeyhole size={13} /> Acesso
            </span>
          </div>
          {erro && (
            <div className="gf-auth-alert gf-auth-alert-error" role="alert">
              {erro}
            </div>
          )}
          <form
            className="gf-auth-form gf-auth-register-form"
            onSubmit={cadastrar}
          >
            <div className="gf-auth-field gf-auth-wide">
              <label htmlFor="gf-reg-nome">Nome completo</label>
              <div className="gf-auth-input-wrap">
                <UserRound size={18} />
                <input
                  id="gf-reg-nome"
                  placeholder="Como podemos chamar você?"
                  autoComplete="name"
                  value={form.nome}
                  onChange={(e) => atualizar("nome", e.target.value)}
                  maxLength={120}
                  disabled={enviando}
                  required
                />
              </div>
            </div>
            <div className="gf-auth-field gf-auth-wide">
              <label htmlFor="gf-reg-email">E-mail</label>
              <div className="gf-auth-input-wrap">
                <Mail size={18} />
                <input
                  id="gf-reg-email"
                  type="email"
                  placeholder="voce@exemplo.com"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => atualizar("email", e.target.value)}
                  maxLength={150}
                  disabled={enviando}
                  required
                />
              </div>
            </div>
            <div className="gf-auth-field">
              <label htmlFor="gf-reg-cpf">CPF</label>
              <div className="gf-auth-input-wrap">
                <Fingerprint size={18} />
                <input
                  id="gf-reg-cpf"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  autoComplete="off"
                  value={form.cpf}
                  onChange={(e) => atualizar("cpf", mascaraCPF(e.target.value))}
                  maxLength={14}
                  disabled={enviando}
                  required
                />
              </div>
            </div>
            <div className="gf-auth-field">
              <label htmlFor="gf-reg-telefone">Celular / telefone</label>
              <div className="gf-auth-input-wrap">
                <Phone size={18} />
                <input
                  id="gf-reg-telefone"
                  type="tel"
                  inputMode="tel"
                  placeholder="(00) 00000-0000"
                  autoComplete="tel"
                  value={form.telefone}
                  onChange={(e) =>
                    atualizar("telefone", mascaraTelefone(e.target.value))
                  }
                  maxLength={15}
                  disabled={enviando}
                  required
                />
              </div>
            </div>
            <div className="gf-auth-field">
              <label htmlFor="gf-reg-senha">Criar senha</label>
              <div className="gf-auth-input-wrap">
                <LockKeyhole size={18} />
                <input
                  id="gf-reg-senha"
                  type={mostrarSenha ? "text" : "password"}
                  placeholder="Mínimo de 8 caracteres"
                  autoComplete="new-password"
                  minLength={8}
                  value={form.senha}
                  onChange={(e) => atualizar("senha", e.target.value)}
                  disabled={enviando}
                  required
                />
                <button
                  type="button"
                  className="gf-auth-reveal"
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setMostrarSenha((s) => !s)}
                >
                  {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="gf-auth-field">
              <label htmlFor="gf-reg-confirmar">Confirmar senha</label>
              <div className="gf-auth-input-wrap">
                <LockKeyhole size={18} />
                <input
                  id="gf-reg-confirmar"
                  type={mostrarConfirmacao ? "text" : "password"}
                  placeholder="Repita sua senha"
                  autoComplete="new-password"
                  value={form.confirmarSenha}
                  onChange={(e) => atualizar("confirmarSenha", e.target.value)}
                  disabled={enviando}
                  required
                />
                <button
                  type="button"
                  className="gf-auth-reveal"
                  aria-label={
                    mostrarConfirmacao
                      ? "Ocultar confirmação"
                      : "Mostrar confirmação"
                  }
                  onClick={() => setMostrarConfirmacao((s) => !s)}
                >
                  {mostrarConfirmacao ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>
            <div className="gf-auth-wide gf-auth-password-tip">
              <span className={senhaValida ? "ok" : ""}>
                <Check size={14} /> Pelo menos 8 caracteres
              </span>
              <span className={senhasIguais ? "ok" : ""}>
                <Check size={14} /> Senhas iguais
              </span>
            </div>
            <button
              type="submit"
              className="gf-auth-submit gf-auth-wide"
              disabled={enviando}
            >
              {enviando ? (
                <>
                  <span className="gf-auth-spinner" /> Criando conta...
                </>
              ) : (
                <>
                  Criar minha conta <ArrowRight size={19} />
                </>
              )}
            </button>
          </form>
          <div className="gf-auth-footer">
            <span>Já possui uma conta?</span>{" "}
            <Link to="/">
              Fazer login <ArrowRight size={15} />
            </Link>
          </div>
        </div>
        <div className="gf-auth-footer-bottom">
          © {new Date().getFullYear()} GearFlow • Feito para simplificar sua
          rotina.
        </div>
      </section>
    </main>
  );
}
