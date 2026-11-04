
import Login from "./pages/Login";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard.jsx";
import GestaoEquipe from "./pages/GestaoEquipe.jsx";
import RegistroCliente from "./pages/RegistroCliente";
import DashboardCliente from "./pages/DashboardCliente.jsx";
import GestaoPecas from "./pages/GestaoPecas.jsx";
import Servicos from "./pages/Servicos.jsx";
import FilaPrioridade from "./pages/FilaPrioridade.jsx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/registro" element={<RegistroCliente />} />

        <Route
          path="/DashboardCliente"
          element={<DashboardCliente />}
        />

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
          path="/fila-prioridade"
          element={
            <DashboardLayout titulo="Fila de Prioridade">
              <FilaPrioridade />
            </DashboardLayout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
