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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/registro" element={<RegistroCliente />} />

        <Route path="/DashboardCliente" element={<DashboardCliente />} />

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
          path="/financeiro"
          element={
            <DashboardLayout
              titulo="Dashboard Financeira"
              subtitulo="Indicadores, receitas e desempenho financeiro da oficina"
            >
              <DashboardFinanceiro />
            </DashboardLayout>
          }
        />
          <Route path="/cliente/veiculos" element={<MeusVeiculos />} />
          <Route path="/veiculos" element={<GestaoVeiculos />} />
          <Route path="/cliente/agendamentos" element={<AgendamentoCliente />} />
          <Route path="/agendamentos" element={<GestaoAgendamentos />} />
      </Routes>
    </Router>
  );
}

export default App;
