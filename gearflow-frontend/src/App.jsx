// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import GestaoEquipe from './pages/GestaoEquipe.jsx';
import RegistroCliente from './pages/RegistroCliente';
import DashboardCliente from "./pages/DashboardCliente.jsx";

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
                    <DashboardLayout titulo="Gestão de Equipe (RF03)">
                        <GestaoEquipe />
                    </DashboardLayout>
                } />
            </Routes>
        </Router>
    );
}

export default App;