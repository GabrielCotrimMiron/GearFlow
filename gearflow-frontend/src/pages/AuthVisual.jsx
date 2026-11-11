import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarDays, ClipboardCheck, Gauge, ShieldCheck, Wrench } from "lucide-react";

export default function AuthVisual({ cadastro = false }) {
  return (
    <aside className="gf-auth-visual" aria-label="Apresentação do GearFlow">
      <div className="gf-auth-visual-top">
        <Link to="/" className="gf-auth-brand gf-auth-brand-light" aria-label="GearFlow - início">
          <span className="gf-auth-brand-mark"><Wrench size={21} strokeWidth={2.5} /></span>
          <span>gear<span>flow</span><small>GESTÃO AUTOMOTIVA</small></span>
        </Link>
        <span className="gf-auth-visual-tag"><span className="gf-auth-tag-dot"/> UMA NOVA EXPERIÊNCIA</span>
      </div>
      <div className="gf-auth-visual-body">
        <span className="gf-auth-overline">{cadastro ? "COMECE UMA NOVA JORNADA" : "BEM-VINDO AO FUTURO DA OFICINA"}</span>
        <h1>{cadastro ? <>Seu carro merece<br/><em>mais atenção.</em></> : <>Tudo em ordem.<br/><em>Você no controle.</em></>}</h1>
        <p>{cadastro ? "Crie sua conta e acompanhe serviços, consultas e o histórico do seu veículo em um só lugar." : "Uma plataforma inteligente para conectar clientes, serviços e oficinas com clareza em cada etapa."}</p>
        <div className="gf-auth-illustration" aria-hidden="true">
          <div className="gf-auth-orbit gf-auth-orbit-a"/><div className="gf-auth-orbit gf-auth-orbit-b"/>
          <div className="gf-auth-car-halo"><svg viewBox="0 0 510 220" role="img" aria-hidden="true"><defs><linearGradient id="carBody" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#a6f2e5"/><stop offset="100%" stopColor="#42aea6"/></linearGradient></defs><path d="M67 148 L90 113 L169 96 L209 51 L351 50 L405 97 L449 113 L469 148 Q471 165 449 167 L64 167 Q47 162 67 148Z" fill="url(#carBody)" opacity=".97"/><path d="M184 98 L220 61 L345 61 L395 98Z" fill="#103e4a" opacity=".9"/><path d="M214 64 L204 97 M347 64 L356 97" stroke="#89e7d6" strokeWidth="4"/><path d="M72 149 L467 149" stroke="#e0fff6" strokeWidth="3" opacity=".6"/><circle cx="148" cy="165" r="31" fill="#133741" stroke="#91eadb" strokeWidth="6"/><circle cx="148" cy="165" r="12" fill="#8fdfd1"/><circle cx="391" cy="165" r="31" fill="#133741" stroke="#91eadb" strokeWidth="6"/><circle cx="391" cy="165" r="12" fill="#8fdfd1"/><path d="M430 117 L459 129" stroke="#fff" strokeWidth="8" strokeLinecap="round"/><path d="M82 133 L103 133" stroke="#ffdc91" strokeWidth="8" strokeLinecap="round"/></svg></div>
          <div className="gf-auth-floating gf-auth-float-one"><span><CalendarDays size={17}/></span><div><strong>Agendamentos</strong><small>Mais praticidade</small></div><ArrowUpRight size={14}/></div>
          <div className="gf-auth-floating gf-auth-float-two"><span><ClipboardCheck size={17}/></span><div><strong>Serviço acompanhado</strong><small>Informação em tempo real*</small></div><ShieldCheck size={14}/></div>
          <div className="gf-auth-floating gf-auth-float-three"><Gauge size={17}/><span>Seu veículo. Sua jornada.</span></div>
        </div>
        <div className="gf-auth-benefits"><span><ShieldCheck size={16}/> Conta pessoal</span><span><ClipboardCheck size={16}/> Histórico organizado</span><span><CalendarDays size={16}/> Agendamento online</span></div>
      </div>
      <div className="gf-auth-visual-bottom"><span>GEARFLOW © {new Date().getFullYear()}</span><span>TECNOLOGIA QUE MOVE.</span></div>
    </aside>
  );
}
