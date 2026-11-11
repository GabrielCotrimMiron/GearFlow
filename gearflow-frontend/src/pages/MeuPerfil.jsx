
import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  UserRound,
  Mail,
  ShieldCheck,
  CircleCheck,
  Copy,
  Check,
  LockKeyhole,
  Info,
  Eye,
  EyeOff,
  Fingerprint,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import "./MeuPerfil.css";

function CampoPerfil({ icone: Icone, titulo, valor, copiavel = false }) {
  const [copiado, setCopiado] = useState(false);

  async function copiarValor() {
    if (!valor || valor === "Não informado") return;

    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="perfil-campo">
      <div className="perfil-campo-icone">
        <Icone size={18} />
      </div>

      <div className="perfil-campo-conteudo">
        <span>{titulo}</span>
        <strong>{valor || "Não informado"}</strong>
      </div>

      {copiavel && valor && valor !== "Não informado" && (
        <button
          type="button"
          className="perfil-copiar"
          onClick={copiarValor}
          aria-label={`Copiar ${titulo.toLowerCase()}`}
          title={copiado ? "Copiado!" : "Copiar"}
        >
          {copiado ? <Check size={17} /> : <Copy size={17} />}
        </button>
      )}
    </div>
  );
}

export default function MeuPerfil() {
  const usuario = useOutletContext();

  const [mostrarEmail, setMostrarEmail] = useState(true);

  const nome = usuario?.nome?.trim() || "Cliente";
  const email = usuario?.email?.trim() || "Não informado";

  const iniciais = useMemo(() => {
    const partes = nome.split(/\s+/).filter(Boolean);

    if (partes.length === 1) {
      return partes[0].slice(0, 2).toUpperCase();
    }

    return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
  }, [nome]);

  const primeiroNome = nome.split(" ")[0];

  const emailOculto =
    email === "Não informado"
      ? email
      : email.replace(/^(.{2}).*(@.*)$/, "$1••••$2");

  return (
    <DashboardLayout
      tipoUsuario="CLIENTE"
      titulo="Meu perfil"
      subtitulo="Consulte suas informações pessoais e os detalhes da sua conta."
    >
      <main className="perfil-page">
        {/* CABEÇALHO */}

        <section className="perfil-hero">
          <div className="perfil-hero-conteudo">
            <span className="perfil-kicker">
              <Fingerprint size={14} />
              MINHA CONTA
            </span>

            <h2>Olá, {primeiroNome}!</h2>

            <p>
              Este é seu espaço pessoal no GearFlow.
              Consulte seus dados, acompanhe seu acesso
              e mantenha suas informações organizadas.
            </p>
          </div>

          <div className="perfil-hero-decoracao" aria-hidden="true">
            <UserRound size={75} strokeWidth={1.2} />
          </div>
        </section>

        {/* IDENTIFICAÇÃO DO CLIENTE */}

        <section className="perfil-identidade">
          <div className="perfil-avatar">
            {iniciais}
          </div>

          <div className="perfil-identidade-info">
            <span className="perfil-identidade-label">
              CONTA DO CLIENTE
            </span>

            <h3>{nome}</h3>

            <p>
              {email}
            </p>
          </div>

          <div className="perfil-identidade-status">
            <CircleCheck size={15} />
            Sessão ativa
          </div>
        </section>

        {/* CONTEÚDO */}

        <div className="perfil-grid">
          {/* DADOS PESSOAIS */}

          <section className="perfil-card">
            <div className="perfil-card-header">
              <div className="perfil-card-titulo">
                <div className="perfil-card-icon">
                  <UserRound size={20} />
                </div>

                <div>
                  <h3>Dados pessoais</h3>
                  <p>
                    Informações vinculadas à sua conta.
                  </p>
                </div>
              </div>
            </div>

            <div className="perfil-campos">
              <CampoPerfil
                icone={UserRound}
                titulo="Nome completo"
                valor={nome}
                copiavel
              />

              <div className="perfil-campo">
                <div className="perfil-campo-icone">
                  <Mail size={18} />
                </div>

                <div className="perfil-campo-conteudo">
                  <span>E-mail cadastrado</span>
                  <strong>
                    {mostrarEmail ? email : emailOculto}
                  </strong>
                </div>

                <button
                  type="button"
                  className="perfil-copiar"
                  onClick={() => setMostrarEmail(!mostrarEmail)}
                  title={mostrarEmail ? "Ocultar e-mail" : "Mostrar e-mail"}
                  aria-label={mostrarEmail ? "Ocultar e-mail" : "Mostrar e-mail"}
                >
                  {mostrarEmail ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              <CampoPerfil
                icone={ShieldCheck}
                titulo="Tipo de conta"
                valor="Cliente"
              />
            </div>

            <div className="perfil-card-rodape">
              <Info size={16} />
              <span>
                Os dados exibidos são fornecidos pela
                sua sessão autenticada.
              </span>
            </div>
          </section>

          {/* SEGURANÇA */}

          <section className="perfil-card">
            <div className="perfil-card-header">
              <div className="perfil-card-titulo">
                <div className="perfil-card-icon">
                  <ShieldCheck size={20} />
                </div>

                <div>
                  <h3>Segurança da conta</h3>
                  <p>
                    Informações sobre seu acesso.
                  </p>
                </div>
              </div>
            </div>

            <div className="perfil-seguranca-status">
              <div className="perfil-seguranca-icone">
                <CircleCheck size={21} />
              </div>

              <div>
                <strong>Sessão ativa</strong>
                <span>
                  Você está conectado ao GearFlow.
                </span>
              </div>
            </div>

            <div className="perfil-seguranca-item">
              <LockKeyhole size={19} />

              <div>
                <strong>Credenciais de acesso</strong>
                <p>
                  Sua senha não é exibida nesta página.
                  Nunca compartilhe seus dados de login.
                </p>
              </div>
            </div>

            <div className="perfil-seguranca-item">
              <ShieldCheck size={19} />

              <div>
                <strong>Encerramento de sessão</strong>
                <p>
                  Ao terminar, utilize a opção
                  "Sair do Sistema" no menu lateral,
                  especialmente em computadores compartilhados.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* DICA */}

        <section className="perfil-dica">
          <div className="perfil-dica-icone">
            <Info size={21} />
          </div>

          <div>
            <strong>Precisa atualizar seus dados?</strong>
            <p>
              Caso alguma informação esteja incorreta,
              entre em contato com a oficina para solicitar
              a atualização do cadastro.
            </p>
          </div>
        </section>
      </main>
    </DashboardLayout>
  );
}
