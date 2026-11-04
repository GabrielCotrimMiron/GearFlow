// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import GestaoEquipe from './pages/GestaoEquipe.jsx';
import RegistroCliente from './pages/RegistroCliente';
import DashboardCliente from "./pages/DashboardCliente.jsx";
import GestaoPecas from "./pages/GestaoPecas.jsx";
import Servicos from './pages/Servicos.jsx';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />

                <Route path="/registro" element={<RegistroCliente />} />

                <Route path="/DashboardCliente" element={<DashboardCliente />} />

                <Route path="/dashboard" element={
                    <DashboardLayout titulo="Bom dia, Gerente! 👋">
                        {/* Conteúdo temporário imitando os cartões do seu print */}
                        <p>Aqui entrarão os cartões de resumo financeiro e de serviços.</p>
                    </DashboardLayout>
                } />

                <Route path="/equipe" element={
                    <DashboardLayout titulo="Gestão de Equipe">
                        <GestaoEquipe />
                    </DashboardLayout>
                } />
                <Route path="/pecas" element={
                    <DashboardLayout titulo="Gestão de Peças/Estoque">
                        <GestaoPecas/>
                    </DashboardLayout>
                } />
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
            </Routes>
        </Router>
    );
}

export default App;