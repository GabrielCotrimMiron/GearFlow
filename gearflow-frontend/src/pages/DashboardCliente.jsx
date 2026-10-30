import DashboardLayout from '../components/DashboardLayout';

export default function DashboardCliente() {
    return (
        <DashboardLayout
            titulo="Bem-vindo ao Gearflow!"
            subtitulo="Acompanhe o status dos seus veículos e serviços de forma rápida."
            tipoUsuario="CLIENTE"
        >
            <div>
                <h3 style={{ color: 'var(--gf-primary-dark)' }}>Resumo da Conta</h3>
                <p>Nenhuma ordem de serviço em andamento no momento.</p>
            </div>
        </DashboardLayout>
    );
}