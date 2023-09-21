// Referências: 
//      https://github.com/chrokh/fp-games

const canvas = document.getElementById("dinoPP");
const ctx = canvas.getContext("2d");

const carregarImagem = (caminho) => (estilo) => {
    const img = new Image();
    img.src = caminho;
    img.style = { ...estilo };
    return img;
};

// Função para alterar o estilo do canvas
const criarCenario = (canvas) => (ctx) => (carregadorDeImagens) => () => {
    canvas.width = window.innerWidth; 

    const logo = carregadorDeImagens("./assets/logo.png")({ display: "block", marginLeft: "auto", marginRight: "auto" });
    // (imagem, distanciaX, DistanciaY, tamanhoX, tamanhoY)
    // distânciaX = janelaX/2 - logoX/2 <=> centro X da janela
    // tamanhos X e Y são logo/3, mantendo a proporção
    logo.onload = () => ctx.drawImage(logo, window.innerWidth / 2 - logo.width / 6, 0, logo.width / 3, logo.height / 3);

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, window.innerWidth, 500);
    console.log(logo.width);
};

const Jogador = {};
Jogador.pulando = false;
Jogador.perdeu = false;

// Criação do estado
const Estado = {};

// Essa função deve ser reutilizada, mudando apenas o multiplicador. Retorna uma coordenada
Estado.velocidade = (multiplicador) => (coordenadas) => ({ ...coordenadas, x: coordenadas.x * multiplicador, y: coordenadas.y * multiplicador });
// Posição atual somada com a posição desejada em função da velocidade. Retorna uma coordenada
Estado.moverCoordenadas = (velocidade) => (coordenadas) => (posicaoAtual) => ({ ...posicaoAtual, x: posicaoAtual.x + velocidade(coordenadas.x), y: posicaoAtual.y + velocidade(coordenadas.y) });

// Criação do evento de redimensionar; Quando redimensionado, o cenário deve ser recarregado para que não haja bugs
window.addEventListener("resize", criarCenario(canvas)(ctx)(carregarImagem));
// A FAZER | Criação do evento ao pressionar tecla, necessário para ações como a de pular
window.addEventListener("keydown", (e) => { if (e.code == "Space") { console.log("Espaço") }});

criarCenario(canvas)(ctx)(carregarImagem)();


