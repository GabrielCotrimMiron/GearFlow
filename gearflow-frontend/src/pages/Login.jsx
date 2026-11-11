import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Wrench } from "lucide-react";
import api from "../services/api";
import { consultarSessao } from "../services/session";
import AuthVisual from "./AuthVisual";
import "./AuthPages.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const registroCriado = location.state?.registroCriado === true;

  async function handleLogin(evento) {
    evento.preventDefault();
    if (carregando) return;
    setErro("");
    setCarregando(true);
    try {
      const resposta = await api.post("/auth/login", { email: email.trim(), senha });
      const sessao = await consultarSessao();
      if (!sessao) throw new Error("Não foi possível confirmar a sessão.");
      window.dispatchEvent(new Event("gearflow:sessao-alterada"));
      const destinoPadrao = resposta.data?.user === "CLIENTE" ? "/DashboardCliente" : "/dashboard";
      const solicitado = location.state?.from;
      const destino = typeof solicitado === "string" && solicitado.startsWith("/") && !solicitado.startsWith("//") ? solicitado : destinoPadrao;
      navigate(destino, { replace: true, state: null });
    } catch (erroRecebido) {
      if (erroRecebido.response?.status === 401 || erroRecebido.response?.status === 403) {
        setErro("E-mail ou senha incorretos. Confira os dados e tente novamente.");
      } else {
        setErro("Não foi possível entrar agora. Verifique sua conexão e tente novamente.");
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="gf-auth-page">
      <AuthVisual />
      <section className="gf-auth-form-side">
        <div className="gf-auth-mobile-brand"><Wrench size={20}/> <span>gear<strong>flow</strong></span></div>
        <div className="gf-auth-form-shell">
          <div className="gf-auth-pill"><LockKeyhole size={14}/> ACESSO À PLATAFORMA</div>
          <h2>Bom ter você <span>de volta.</span></h2>
          <p className="gf-auth-lead">Entre na sua conta para continuar de onde parou.</p>
          {registroCriado && <div className="gf-auth-alert gf-auth-alert-success" role="status"><ShieldCheck size={19}/> Conta criada! Entre com seu e-mail e senha.</div>}
          {erro && <div className="gf-auth-alert gf-auth-alert-error" role="alert">{erro}</div>}
          <form onSubmit={handleLogin} className="gf-auth-form">
            <label htmlFor="gf-login-email">Endereço de e-mail</label>
            <div className="gf-auth-input-wrap"><Mail size={19}/><input id="gf-login-email" type="email" placeholder="voce@exemplo.com" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={carregando}/></div>
            <div className="gf-auth-label-row"><label htmlFor="gf-login-password">Sua senha</label></div>
            <div className="gf-auth-input-wrap"><LockKeyhole size={19}/><input id="gf-login-password" type={mostrarSenha ? "text" : "password"} placeholder="Digite sua senha" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required disabled={carregando}/><button className="gf-auth-reveal" type="button" onClick={() => setMostrarSenha((v) => !v)} aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"} aria-pressed={mostrarSenha}>{mostrarSenha ? <EyeOff size={19}/> : <Eye size={19}/>}</button></div>
            <button className="gf-auth-submit" type="submit" disabled={carregando}>{carregando ? <><span className="gf-auth-spinner"/> Entrando...</> : <>Entrar na minha conta <ArrowRight size={19}/></>}</button>
          </form>
          <div className="gf-auth-footer"><span>Ainda não tem uma conta?</span> <Link to="/registro">Criar conta gratuitamente <ArrowRight size={15}/></Link></div>
          <p className="gf-auth-note"><ShieldCheck size={15}/> Suas informações de acesso são tratadas pelo servidor.</p>
        </div>
        <div className="gf-auth-footer-bottom">© {new Date().getFullYear()} GearFlow • Feito para simplificar sua rotina.</div>
      </section>
    </main>
  );
}
