// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import GestaoEquipe from './pages/GestaoEquipe.jsx';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />

                <Route path="/dashboard" element={
                    <DashboardLayout titulo="Bom dia, Gerente! 👋">
                        {/* Conteúdo temporário imitando os cartões do seu print */}
                        <p>Aqui entrarão os cartões de resumo financeiro e de serviços.</p>
                    </DashboardLayout>
                } />

                <Route path="/equipe" element={
                    <DashboardLayout titulo="Gestão de Equipe (RF03)">
                        <GestaoEquipe />
                        <p>Aqui faremos o formulário para inserir os dados do novo mecânico que conectará com o POST /funcionarios.</p>
                    </DashboardLayout>
                } />
            </Routes>
        </Router>
    );
}

export default App;