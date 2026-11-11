import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { consultarSessao } from "./services/session";
import Login from "./pages/Login";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard.jsx";
import GestaoEquipe from "./pages/GestaoEquipe.jsx";
import RegistroCliente from "./pages/RegistroCliente";
import DashboardCliente from "./pages/DashboardCliente.jsx";
import GestaoPecas from "./pages/GestaoPecas.jsx";
import Servicos from "./pages/Servicos.jsx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import GestaoOrdensServico from "./pages/GestaoOrdensServico.jsx";
import DashboardFinanceiro from "./pages/DashboardFinanceiro.jsx";
import MeusVeiculos from "./pages/VeiculosCliente.jsx";
import GestaoVeiculos from "./pages/GestaoVeiculos";
import AgendamentoCliente from "./pages/Agendamento";
import GestaoAgendamentos from "./pages/GestaoAgendamento";
import MeuPerfil from "./pages/MeuPerfil";
import Inspecao3D from "./pages/Inspecao3D";
import GestaoClientes from "./pages/GestaoClientes.jsx";

function Protegido({ perfil }) {
  const [estado, setEstado] = useState({
    carregando: true,
    usuario: null,
    erro: false,
  });
  const local = useLocation();
  useEffect(() => {
    let ativo = true;
    const carregar = () => {
      consultarSessao()
        .then((usuario) => {
          if (ativo) setEstado({ carregando: false, usuario, erro: false });
        })
        .catch(() => {
          if (ativo)
            setEstado({ carregando: false, usuario: null, erro: true });
        });
    };
    carregar();
    window.addEventListener("gearflow:sessao-alterada", carregar);
    return () => {
      ativo = false;
      window.removeEventListener("gearflow:sessao-alterada", carregar);
    };
  }, []);
  if (estado.carregando)
    return <div className="gf-auth-loading">Verificando sua sessão...</div>;
  if (estado.erro)
    return (
      <div className="gf-auth-loading">
        Não foi possível verificar a sessão.{" "}
        <button onClick={() => window.location.reload()}>
          Tentar novamente
        </button>
      </div>
    );
  if (!estado.usuario)
    return <Navigate to="/" replace state={{ from: local.pathname }} />;
  const cliente = estado.usuario.user === "CLIENTE";
  if (perfil === "CLIENTE" && !cliente)
    return <Navigate to="/dashboard" replace />;
  if (perfil === "FUNCIONARIO" && cliente)
    return <Navigate to="/DashboardCliente" replace />;
  return <Outlet context={estado.usuario} />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/registro" element={<RegistroCliente />} />

        <Route element={<Protegido perfil="CLIENTE" />}>
          <Route path="/DashboardCliente" element={<DashboardCliente />} />
          <Route path="/cliente/veiculos" element={<MeusVeiculos />} />
          <Route
            path="/cliente/agendamentos"
            element={<AgendamentoCliente />}
          />
          <Route
            path="/minhas-os"
            element={<DashboardCliente modo="ordens" />}
          />
          <Route path="/meu-perfil" element={<MeuPerfil />} />
          <Route
            path="/cliente/inspecao-3d"
            element={<Inspecao3D tipoUsuario="CLIENTE" />}
          />
          <Route
            path="/cliente/inspecao-3d/:ordemId"
            element={<Inspecao3D tipoUsuario="CLIENTE" />}
          />
        </Route>
        <Route element={<Protegido perfil="FUNCIONARIO" />}>
          <Route
            path="/dashboard"
            element={
              <DashboardLayout titulo="Painel Gerencial">
                <Dashboard />
              </DashboardLayout>
            }
          />

          <Route
            path="/equipe"
            element={
              <DashboardLayout titulo="Gestão de Equipe">
                <GestaoEquipe />
              </DashboardLayout>
            }
          />

          <Route
            path="/pecas"
            element={
              <DashboardLayout titulo="Gestão de Peças/Estoque">
                <GestaoPecas />
              </DashboardLayout>
            }
          />

          <Route
            path="/servicos"
            element={
              <DashboardLayout
                titulo="Catálogo de Serviços"
                subtitulo="Definição de preços fixos de mão de obra e tempos estimados"
              >
                <Servicos />
              </DashboardLayout>
            }
          />
          <Route
            path="/ordens-servico"
            element={
              <DashboardLayout
                titulo="Gestão de Ordens de Serviço"
                subtitulo="Acompanhe os atendimentos, revise orçamentos e gerencie as ordens da oficina"
              >
                <GestaoOrdensServico />
              </DashboardLayout>
            }
          />
          <Route
            path="/financeiro"
            element={
              <DashboardLayout
                titulo="Gestão Financeira"
                subtitulo="Controle de receitas, despesas e fluxo de caixa"
              >
                <DashboardFinanceiro />
              </DashboardLayout>
            }
          />

          <Route
            path="/inspecao-3d"
            element={<Inspecao3D tipoUsuario="FUNCIONARIO" />}
          />
          <Route
            path="/inspecao-3d/:ordemId"
            element={<Inspecao3D tipoUsuario="FUNCIONARIO" />}
          />
          <Route path="/veiculos" element={<GestaoVeiculos />} />
          <Route path="/agendamentos" element={<GestaoAgendamentos />} />
        </Route>

        <Route
          path="/clientes-admin"
          element={
            <DashboardLayout
              titulo="Gestão de Clientes"
              subtitulo="Cadastros e informações dos clientes autorizados"
            >
              <GestaoClientes />
            </DashboardLayout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
