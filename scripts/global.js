// Referências: 
//      https://github.com/chrokh/fp-games

const canvas = document.getElementById("dinoPP");
const ctx = canvas.getContext("2d");
 
// Executa recursivamente uma lista de funções
const execFuncoes = ([primeiroElemento, ...resto]) => {
    if (typeof primeiroElemento == "undefined") return;
    primeiroElemento()
    return execFuncoes(resto)
};

// Criação do cenário
const Cenario = {};
Cenario.tamanho = (ctx) => ({ x: ctx.canvas.clientWidth, y: ctx.canvas.clientHeight }); // Retorna o tamanho do canvas
Cenario.proporcao = (multiplicador) => (coordenadas) => ({ x: coordenadas.x * multiplicador, y: coordenadas.y * multiplicador }); // Redimensiona coordenadas
Cenario.criarImagem = (caminho) => (estilo) => {
    const imagem = new Image();
    imagem.src = caminho;
    imagem.style = { ...estilo };
    return imagem;
};
// Preparar a formatação para poder exibir o texto
Cenario.formatarTexto = (ctx) => (tamanho) => (cor) => {
    ctx.fillStyle = cor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${tamanho}px arial`;
    return ctx;
}

// Criação do jogador
const Jogador = {};
Jogador.pulando = false;
Jogador.perdeu = false;

// Criação do estado
const Estado = {};
Estado.velocidade = (multiplicador) => (coordenadas) => ({ ...coordenadas, x: coordenadas.x * multiplicador, y: coordenadas.y * multiplicador }); // Essa função deve ser reutilizada, mudando apenas o multiplicador
Estado.moverCoordenadas = (velocidade) => (coordenadas) => (posicaoAtual) => ({ ...posicaoAtual, x: posicaoAtual.x + velocidade(coordenadas.x), y: posicaoAtual.y + velocidade(coordenadas.y) }); // Posição atual somada com a posição desejada em função da velocidade

const carregarMenu = (ctx) => (cenario) => {
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    const canvasTamanho = cenario.tamanho(ctx);
    const canvasCentro = cenario.proporcao(1/2)(canvasTamanho);

    const logo = cenario.criarImagem("assets/logo.png")();
    logo.onload = () => {
        const logoDimensoes = cenario.proporcao(1/3)({ x: logo.width, y: logo.height });
        const logoPosicao = cenario.proporcao(1/2)(logoDimensoes);
        ctx.drawImage(logo, canvasCentro.x - logoPosicao.x, canvasCentro.y - logoPosicao.y, logoDimensoes.x, logoDimensoes.y);
    };

    const mensagemComecar = cenario.formatarTexto(ctx)(25)("#000000");
    mensagemComecar.fillText("Pressione ESPAÇO para começar a jogar", canvasCentro.x, canvasTamanho.y - 100);
};

const TELA_INICIAL = [ () => carregarMenu(ctx)(Cenario) ]
const JOGO = [];
const carregarTelaInicial = () => execFuncoes(TELA_INICIAL);

// A FAZER | Criação do evento ao pressionar tecla, necessário para ações como a de pular
window.addEventListener("keydown", (e) => { if (e.code == "Space") { console.log("Espaço") }});
window.addEventListener("resize", carregarTelaInicial); // Quando redimensionado, o cenário deve ser recarregado para evitar erros

carregarTelaInicial(); // Primeira impressão