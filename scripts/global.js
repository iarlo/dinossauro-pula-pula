// Referências: 
//      https://github.com/chrokh/fp-games

const canvas = document.getElementById("dinoPP");
const ctx = canvas.getContext("2d");
const logo = Cenario.criarImagem("assets/logo.png")();

// Executa recursivamente uma lista de funções
const execFuncoes = ([primeiroElemento, ...resto]) => {
    if (typeof primeiroElemento == "undefined") return;
    primeiroElemento();
    return execFuncoes(resto);
};

// Criar menu principal: logo, texto
const criarMenu = (ctx) => (logo) => (cenario) => {
    // Define o tamanho do canvas para o mesmo tamanho da janela
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    const canvasTamanho = cenario.tamanho(ctx); // Tamanho do canvas
    const canvasCentro = cenario.proporcao(1/2)(canvasTamanho); // Centro do canvas
    const logoDimensoes = cenario.proporcao(1/3)({ x: logo.width, y: logo.height }); // Dimensões da imagem logo
    const logoPosicao = cenario.proporcao(1/2)(logoDimensoes); // Posição da imagem logo

    ctx.drawImage(logo, canvasCentro.x - logoPosicao.x, canvasCentro.y - logoPosicao.y, logoDimensoes.x, logoDimensoes.y); // Imprimir a logo

    const mensagemComecar = cenario.formatarTexto(ctx)(25)("center")("#000000"); // Criação do texto da tela inicial
    mensagemComecar.fillText("Pressione ESPAÇO para começar a jogar", canvasCentro.x, canvasTamanho.y - 100);
    ctx.closePath();
};

// Criar fase: jogador, obstáculos, potuação
const criarFase = (ctx) => (estado) => (cenario) => (jogador) => {
    if (estado.faseAtual < 1) return;
    if (estado.obstaculos.length === 0) estado.obstaculos = Array(5).fill().map((valor, index) => cenario.criarObstaculo((estado.semente() + 1) * 200)(index)(window.innerWidth));
    
    // Caso o primeiro obstáculo da lista esteja fora da tela, remover da lista e criar um novo
    if (estado.obstaculos[0].x < 0) {
        estado.obstaculos = estado.obstaculos.slice(1);
        estado.obstaculos.push(cenario.criarObstaculo((estado.semente() + 1) * 200)(4)(0));
    };

    // Define o tamanho do canvas
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    const canvasTamanho = cenario.tamanho(ctx);

    // Mapeia os obstáculos para serem impressos e retorna uma nova posição para eles
    estado.obstaculos = estado.obstaculos.map((valor, index) => {
        cenario.desenharObstaculo(ctx)({ x: 25, y: 50 })({ x: valor.x * 2, y: valor.y });
        return { ...valor, x: valor.x - window.innerWidth / 1000 };
    });

    jogador.pular(75); // Define a altura do pulo
    jogador.desenhar(ctx)(jogador.posicao)({ x: 25, y: 25 }); // Imprimir jogador
    
     // Preparar texto de pontuação
    const pontuacao = cenario.formatarTexto(ctx)(16)("right")("black");
    pontuacao.fillText(estado.pontuacao, canvasTamanho.x - 100, 100);
    ctx.closePath();
};

const TELA_INICIAL = [ () => criarMenu(ctx)(logo)(Cenario) ];
const JOGO = [ () => criarFase(ctx)(Estado)(Cenario)(Jogador) ];

// Executar recursivamente uma lista de funções
const carregarTelaInicial = () => execFuncoes(TELA_INICIAL);
const carregarFase = () => execFuncoes(JOGO);

window.addEventListener("keydown", (e) => { 
    if (e.code != "Space")  return;
    if (Estado.faseAtual == 0) Estado.faseAtual = 1;
    if (Jogador.estaEmAnimacao || Jogador.estaPulando) return;
    Jogador.estaPulando = true;
}, false); // Evento de quando pressionada a tecla espaço. Caso esteja no menu, o jogo será iniciado; Caso esteja no jogo, a ação pular será chamada

window.addEventListener("resize", () => {
    Estado.faseAtual = 0;
    Estado.obstaculos = [];
}, false); // Quando redimensionado, o cenário deve ser recarregado para evitar erros

const loopJogo = (tempo) => {
    if (Estado.faseAtual > 0) Estado.pontuacao = Cenario.moverCoordenadas({ x: 1, y: 0 })({ x: Estado.pontuacao, y: 0 }).x;
    carregarTelaInicial();
    carregarFase();
    window.requestAnimationFrame(loopJogo);
};

logo.onload = () => window.requestAnimationFrame(loopJogo);