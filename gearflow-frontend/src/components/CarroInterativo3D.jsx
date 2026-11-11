import { useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { CameraControls, ContactShadows, Html, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

// Coordenadas do modelo DIDÁTICO, não são posições mecânicas aferidas em um Onix.
export const REGIOES_3D = {
  MOTOR: { nome: "Motor", pos: [0, 1.11, 1.32], camera: [2.6, 2.8, 3.6] },
  ARREFECIMENTO: { nome: "Arrefecimento", pos: [0.57, 1.0, 1.88], camera: [2.4, 2.35, 3.3] },
  BATERIA: { nome: "Bateria", pos: [-0.58, 1.02, 1.7], camera: [-2.5, 2.3, 3.5] },
  FREIOS_DIANTEIROS: { nome: "Freios dianteiros", pos: [1.04, 0.5, 1.5], camera: [3.2, 1.5, 2.5] },
  FREIOS_TRASEIROS: { nome: "Freios traseiros", pos: [1.04, 0.5, -1.46], camera: [3.4, 1.65, -2.7] },
  SUSPENSAO: { nome: "Suspensão", pos: [-1.01, 0.5, -1.5], camera: [-3.35, 1.5, -2.6] },
  TRANSMISSAO: { nome: "Transmissão", pos: [0, 0.4, 0.35], camera: [3, -0.32, 1.9] },
  ESCAPAMENTO: { nome: "Escapamento", pos: [0, 0.24, -1], camera: [2.9, -0.4, -2] },
  PNEUS: { nome: "Pneus", pos: [-1.08, 0.52, 1.5], camera: [-3, 1.3, 2.8] },
  LATARIA: { nome: "Lataria", pos: [0, 1.68, -0.6], camera: [3.6, 2.8, 4.4] },
};

const PINTURA = "#2b7c91";
const VIDRO = "#86bccb";
const ESCURO = "#182a35";

function PecaBox({ pos, args, cor = PINTURA, raio = 0.07, opacity = 1, ...props }) {
  // Evita radius maior do que metade da espessura de peças finas (vidros, frisos etc.).
  const raioSeguro = Math.max(0.001, Math.min(raio, Math.min(...args) / 2 - 0.001));
  return (
    <RoundedBox args={args} radius={raioSeguro} smoothness={4} position={pos} {...props}>
      <meshStandardMaterial color={cor} roughness={0.38} metalness={0.23}
        transparent={opacity < 1} opacity={opacity} />
    </RoundedBox>
  );
}

function Roda({ lado, eixo }) {
  const x = lado * 0.99;
  return (
    <group position={[x, 0.48, eixo]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.435, 0.435, 0.24, 32]} />
        <meshStandardMaterial color="#101a21" roughness={0.86} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[lado * 0.14, 0, 0]}>
        <cylinderGeometry args={[0.265, 0.265, 0.018, 24]} />
        <meshStandardMaterial color="#c6d5de" metalness={0.78} roughness={0.25} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[lado * 0.16, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.025, 16]} />
        <meshStandardMaterial color="#455561" metalness={0.65} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Capo({ aberto, visivel }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.x = THREE.MathUtils.damp(
      ref.current.rotation.x, aberto ? -1.03 : 0, 5, delta);
  });
  return (
    <group ref={ref} position={[0, 1.12, 0.55]}>
      <PecaBox pos={[0, 0, 0.81]} args={[1.79, 0.105, 1.62]}
        opacity={visivel ? 0.35 : 1} raio={0.08} castShadow />
      <PecaBox pos={[0, 0.065, 0.96]} args={[1.25, 0.012, 0.52]}
        cor="#50a5b3" raio={0.008} opacity={visivel ? 0.2 : 0.65} />
    </group>
  );
}

function Porta({ lado, aberto, raioX }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y = THREE.MathUtils.damp(
      ref.current.rotation.y, aberto ? -lado * 1.02 : 0, 5, delta);
  });
  return (
    <group ref={ref} position={[lado * 0.84, 0.91, 0.44]}>
      <PecaBox pos={[lado * 0.032, -0.06, -0.59]} args={[0.095, 0.73, 1.08]}
        raio={0.025} castShadow />
      <PecaBox pos={[lado * 0.03, 0.33, -0.57]} args={[0.06, 0.35, 0.91]}
        cor={VIDRO} opacity={0.42} raio={0.018} />
      <PecaBox pos={[lado * 0.088, -0.02, -0.34]} args={[0.024, 0.04, 0.16]}
        cor="#d5e7ec" raio={0.012} />
      <PecaBox pos={[lado * 0.025, 0.2, -0.05]} args={[0.18, 0.1, 0.17]}
        cor={ESCURO} raio={0.025} rotation={[0, 0, lado * 0.3]} />
      {raioX === "borda" && <PecaBox pos={[lado * 0.005, -0.04, -1.1]}
        args={[0.05, 0.75, 0.07]} cor="#163340" raio={0.012} />}
    </group>
  );
}

function Motor() {
  return (
    <group position={[0, 0.98, 1.45]}>
      <PecaBox pos={[0, 0.03, 0]} args={[0.92, 0.29, 0.67]} cor="#495a62" castShadow />
      <PecaBox pos={[0, 0.23, 0]} args={[0.83, 0.13, 0.48]} cor="#263b45" />
      {[-0.29, -0.095, 0.1, 0.29].map((x) => (
        <mesh key={x} position={[x, 0.31, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.075, 0.11, 16]} />
          <meshStandardMaterial color="#8ba2ac" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
      <PecaBox pos={[-0.62, -0.005, 0.31]} args={[0.29, 0.26, 0.3]} cor="#2b363e" raio={0.03} />
      <PecaBox pos={[0.62, -0.02, 0.24]} args={[0.24, 0.25, 0.24]} cor="#b0d5d5" raio={0.04} opacity={0.85} />
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0.43, -0.03, -0.22]}>
        <torusGeometry args={[0.2, 0.055, 10, 22]} />
        <meshStandardMaterial color="#171f26" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Chassi({ raioX, portasAbertas, capoAberto }) {
  const translucido = raioX ? 0.28 : 1;
  return (
    <group>
      {/* Estrutura; versão esquemática de hatch compacto, não um Chevrolet Onix fiel. */}
      <PecaBox pos={[0, 0.47, 0]} args={[1.72, 0.15, 4.25]} cor="#25333d" castShadow />
      <PecaBox pos={[0, 0.72, -0.37]} args={[1.64, 0.34, 2.55]}
        opacity={raioX ? 0.17 : 1} castShadow />
      <PecaBox pos={[0, 0.74, -1.84]} args={[1.81, 0.43, 0.77]}
        opacity={translucido} castShadow />
      <PecaBox pos={[0, 0.74, 2.0]} args={[1.84, 0.36, 0.38]}
        opacity={translucido} castShadow />
      <PecaBox pos={[0, 1.69, -0.54]} args={[1.49, 0.13, 1.97]}
        opacity={translucido} castShadow raio={0.1} />
      {/* Vidros de uma cabine compacta */}
      <PecaBox pos={[0, 1.35, 0.43]} args={[1.5, 0.59, 0.045]}
        rotation={[-0.42, 0, 0]} cor={VIDRO} opacity={raioX ? 0.16 : 0.48} raio={0.015} />
      <PecaBox pos={[0, 1.34, -1.50]} args={[1.5, 0.48, 0.04]}
        rotation={[0.37, 0, 0]} cor={VIDRO} opacity={raioX ? 0.16 : 0.45} raio={0.015} />
      {[1, -1].map((lado) => (
        <group key={lado}>
          <PecaBox pos={[lado * 0.82, 1.28, -1.09]} args={[0.07, 0.47, 0.8]}
            cor={VIDRO} opacity={raioX ? 0.15 : 0.45} raio={0.019} />
          <PecaBox pos={[lado * 0.79, 1.34, -1.48]} args={[0.075, 0.6, 0.09]}
            cor="#254452" raio={0.02} />
          <PecaBox pos={[lado * 0.78, 1.32, 0.44]} args={[0.075, 0.65, 0.10]}
            cor="#254452" raio={0.02} rotation={[0.35, 0, 0]} />
          <Roda lado={lado} eixo={1.5} />
          <Roda lado={lado} eixo={-1.48} />
          <Porta lado={lado} aberto={portasAbertas} raioX={"borda"} />
          <PecaBox pos={[lado * 0.68, 0.52, -1.55]} args={[0.3, 0.24, 0.75]}
            opacity={translucido} />
          {/* faróis dianteiros e traseiros */}
          <PecaBox pos={[lado * 0.72, 0.91, 2.22]} args={[0.33, 0.13, 0.055]}
            cor="#eef9fa" raio={0.037} />
          <PecaBox pos={[lado * 0.72, 0.9, -2.21]} args={[0.32, 0.15, 0.05]}
            cor="#f45358" raio={0.04} />
        </group>
      ))}
      {/* Partes internas e assoalho */}
      <Motor />
      <Capo aberto={capoAberto} visivel={raioX} />
      <PecaBox pos={[0, 0.33, 0.15]} args={[0.38, 0.20, 0.85]}
        cor="#4b535b" raio={0.06} />
      <PecaBox pos={[0, 0.23, -1.15]} args={[0.16, 0.16, 1.6]}
        cor="#9ba5a7" raio={0.05} />
      <PecaBox pos={[0, 0.21, -1.92]} args={[0.48, 0.21, 0.47]}
        cor="#858f93" raio={0.07} />
      {[-0.33, 0.33].map((x) => (
        <group key={x}>
          <PecaBox pos={[x, 0.87, -0.55]} args={[0.47, 0.7, 0.44]}
            cor="#253744" raio={0.1} />
          <PecaBox pos={[x, 1.30, -0.75]} args={[0.43, 0.44, 0.18]}
            cor="#33444f" raio={0.065} />
        </group>
      ))}
    </group>
  );
}

const CORES_SEVERIDADE = { BAIXA: "#4ad6ac", MEDIA: "#ffc164", ALTA: "#ff7e6d", CRITICA: "#ff516b" };

function Marcador({ codigo, anotacoes, selecionada, onSelecionar }) {
  const dados = REGIOES_3D[codigo];
  const pendentes = anotacoes.filter((item) => item.regiao === codigo && !item.resolvido);
  const maior = pendentes.some((a) => a.gravidade === "CRITICA") ? "CRITICA"
    : pendentes.some((a) => a.gravidade === "ALTA") ? "ALTA"
      : pendentes.some((a) => a.gravidade === "MEDIA") ? "MEDIA" : "BAIXA";
  const cor = pendentes.length ? CORES_SEVERIDADE[maior] : "#8be4ed";
  return (
    <group position={dados.pos}>
      <mesh onClick={(evento) => { evento.stopPropagation(); onSelecionar(codigo); }}>
        <sphereGeometry args={[selecionada ? 0.10 : 0.075, 18, 18]} />
        <meshStandardMaterial color={cor} emissive={cor} emissiveIntensity={selecionada ? 0.85 : 0.44} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[selecionada ? 0.18 : 0.135, 0.012, 8, 24]} />
        <meshBasicMaterial color={cor} transparent opacity={selecionada ? 1 : 0.48} />
      </mesh>
      {(selecionada || pendentes.length > 0) && (
        <Html position={[0, 0.2, 0]} center distanceFactor={6} occlude={false}>
          <button type="button" className={`insp3d-marker-label ${selecionada ? "selected" : ""}`}
            onClick={() => onSelecionar(codigo)}>
            {dados.nome}{pendentes.length ? ` · ${pendentes.length}` : ""}
          </button>
        </Html>
      )}
    </group>
  );
}

function CameraDirigida({ vista, selecionada }) {
  const controle = useRef();
  useEffect(() => {
    if (!controle.current) return;
    const alvo = selecionada && vista === "detalhe" ? REGIOES_3D[selecionada] : null;
    const pos = alvo?.camera ?? (vista === "inferior" ? [3, -0.65, 2.45]
      : vista === "frente" ? [0, 1.7, 6.5]
        : vista === "lateral" ? [6.6, 2, 0]
          : [4.7, 3.3, 5.9]);
    const target = alvo?.pos ?? (vista === "inferior" ? [0, 0.34, 0] : [0, 0.85, 0]);
    controle.current.setLookAt(...pos, ...target, true);
  }, [vista, selecionada]);
  return <CameraControls ref={controle} minDistance={1.35} maxDistance={13}
    minPolarAngle={0.05} maxPolarAngle={Math.PI - 0.06} smoothTime={0.45} />;
}

export default function CarroInterativo3D({ anotacoes = [], selecionada, onSelecionar,
  capoAberto, portasAbertas, raioX, vista = "geral" }) {
  return (
    <div className="insp3d-canvas" role="region"
      aria-label="Visualizador tridimensional interativo de um hatch genérico, com partes móveis e regiões selecionáveis">
      <Canvas shadows camera={{ position: [4.7, 3.3, 5.9], fov: 44 }} dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: "high-performance" }}>
        <color attach="background" args={["#e8f4f5"]} />
        <ambientLight intensity={1.5} />
        <hemisphereLight args={["#e2fbff", "#597d88", 1.7]} />
        <directionalLight position={[4, 7, 5]} intensity={2.5} castShadow
          shadow-mapSize={[1024, 1024]} shadow-camera-far={25} />
        <spotLight position={[-5, 8, -3]} intensity={0.8} angle={0.8} />
        <Chassi raioX={raioX} portasAbertas={portasAbertas} capoAberto={capoAberto} />
        {Object.keys(REGIOES_3D).map((codigo) => (
          <Marcador key={codigo} codigo={codigo} anotacoes={anotacoes}
            selecionada={selecionada === codigo} onSelecionar={onSelecionar} />
        ))}
        {vista !== "inferior" && <ContactShadows position={[0, -0.08, 0]}
          opacity={0.33} scale={11} blur={2.5} far={4} />}
        <gridHelper args={[12, 24, "#b4d3d6", "#d6e7e9"]} position={[0, -0.1, 0]} visible={vista !== "inferior"} />
        <CameraDirigida vista={vista} selecionada={selecionada} />
      </Canvas>
      <span className="insp3d-watermark">MODELO ESQUEMÁTICO • NÃO REPRESENTA A MECÂNICA EXATA DO VEÍCULO</span>
    </div>
  );
}
