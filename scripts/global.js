/* Referências: 
      https://github.com/chrokh/fp-games 
*/

const canvas = document.getElementById("dinoPP");
const ctx = canvas.getContext("2d");
const logo = Cenario.criarImagem("assets/logo.png")();
const tempoAtual = new Date();

/*  Executa recursivamente uma lista de funções.
    Poupa tempo caso, no futuro, seja necessária a adição de mais 
    funções ao loop sem alterar o corpo da função ´loopJogo´ */
const execFuncoes = ([primeiroElemento, ...resto]) => {
    if (typeof primeiroElemento == "undefined") return;
    primeiroElemento();
    return execFuncoes(resto);
};

/* -------------------------------------------------------------------------- */
/*                                    JOGO                                    */
/* -------------------------------------------------------------------------- */

/*  Aqui onde é criado o menu principal.
    Impressão da logo e mensagem. */
const criarMenu = (ctx) => (logo) => (cenario) => {
    // Define o tamanho do canvas para o mesmo tamanho da janela
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    const canvasTamanho = cenario.tamanho(ctx); // Tamanho do canvas
    const canvasCentro  = cenario.proporcao(1/2)(canvasTamanho); // Centro do canvas
    const logoDimensoes = cenario.proporcao(1/3)({ x: logo.width, y: logo.height }); // Dimensões da imagem logo
    const logoPosicao   = cenario.proporcao(1/2)(logoDimensoes); // Posição da imagem logo

    ctx.drawImage(logo, canvasCentro.x - logoPosicao.x, canvasCentro.y - logoPosicao.y, logoDimensoes.x, logoDimensoes.y); // Imprimir a logo

    const mensagemComecar = cenario.formatarTexto(ctx)(25)("center")("#000000"); // Criação do texto da tela inicial
    mensagemComecar.fillText("Pressione ESPAÇO para começar a jogar", canvasCentro.x, canvasTamanho.y - 100);
    ctx.closePath();
};

// Criar fase: jogador, obstáculos, potuação
const criarFase = (ctx) => (estado) => (cenario) => (jogador) => {
    if (estado.faseAtual < 1) return;
    if (estado.obstaculos.length === 0) estado.obstaculos = Array(5).fill().map((valor, index) => cenario.criarObstaculo((estado.semente() + 1) * 200)(index)(window.innerWidth));
    if (estado.habilidades.length === 0) estado.habilidades = Array(1).fill().map((valor, index) => cenario.criarObstaculo((estado.semente() + 1) * 500)(2)(window.innerWidth));
    
    // Caso o primeiro obstáculo da lista esteja fora da tela, remover da lista e criar um novo
    if (estado.obstaculos[0].x < 0) {
        estado.obstaculos = estado.obstaculos.slice(1);
        estado.obstaculos.push(cenario.criarObstaculo((estado.semente() + 1) * 200)(4)(0));
    };

    // Caso a primeira habilidade da lista esteja fora da tela, remover da lista e criar uma nova
    if (estado.habilidades[0].x < 0) {
        estado.habilidades = estado.habilidades.slice(1);
        estado.habilidades.push(cenario.criarObstaculo((estado.semente() + 1) * 200)(5)(0));
    }
    // Define o tamanho do canvas
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    const canvasTamanho = cenario.tamanho(ctx);

    // Mapeia os obstáculos para serem impressos e retorna uma nova posição para eles
    estado.obstaculos = estado.obstaculos.map((valor, index) => {
        cenario.desenharObstaculo(ctx)({ x: 25, y: 50 })({ x: valor.x * estado.velocidadeInicial, y: valor.y });
        return { ...valor, x: valor.x - estado.velocidade };
    });

    // Mapeia as habilidades para serem impressos e retorna uma nova posição para elas
    estado.habilidades = estado.habilidades.map((valor, index) => {
        cenario.desenharHabilidade(ctx)({ x: 25, y: 25 })({ x: valor.x * estado.velocidadeInicial, y: valor.y });
        return { ...valor, x: valor.x - estado.velocidade };
    });

    jogador.pular(125); // Define a altura do pulo
    jogador.desenhar(ctx)(jogador.posicao)(jogador.tamanho); // Imprimir jogador
    
     // Preparar texto de pontuação
    const pontuacao = cenario.formatarTexto(ctx)(16)("right")("black");
    pontuacao.fillText(estado.pontuacao, canvasTamanho.x - 100, 100);
    ctx.closePath();
};

/* -------------------------------------------------------------------------- */
/*                                   EVENTOS                                  */
/* -------------------------------------------------------------------------- */

/* Evento acionado quando uma tecla é pressionada
    Dentro, podemos gerenciar ações como a de pular, ou iniciar a partida */
window.addEventListener("keydown", (e) => { 
    if (e.code != "Space" || Estado.faseAtual == -1 || Jogador.estaEmAnimacao || Jogador.estaPulando)  return;
    if (Estado.faseAtual == 0) Estado.faseAtual = 1;
    else Jogador.estaPulando = true;
}, false);

/*  Evento acionado quando a janela é redimensionada
    Quando alterado o tamanho da página, o cenário deve ser recarregado para evitar erros */
window.addEventListener("resize", () => {
    Estado.faseAtual = 0;
    Jogador.yInicial = Jogador.resetarYInicial();
    Estado.limparObstaculos();
}, false);

/* -------------------------------------------------------------------------- */
/*                                    LOOP                                    */
/* -------------------------------------------------------------------------- */

/* As duas constantes seguintes são uma lista contendo as funções necessárias para exibir o jogo
    A lista `TELA_INICIAL` contém a função que gera o menu principal
    Em paralelo, a lista `JOGO` contém a função que gera a fase */
const TELA_INICIAL = [ () => criarMenu(ctx)(logo)(Cenario) ];
const JOGO = [ () => criarFase(ctx)(Estado)(Cenario)(Jogador) ];

const loopJogo = (executar) => (listaFuncoes) => (tempoAtual) => (tempo) => {
    /*  ** Infelizmente, até o momento não encontramos uma forma de gerenciar estados sem quebrar o paradigma funcional.
        Seguiremos buscando */
    if (Estado.faseAtual == -1) Estado.faseAtual = 0;
    if (Estado.faseAtual > 0) Estado.pontuacao += 1;

    const tempoNovo = new Date;
    const fps       = 1000 / (tempoNovo - tempoAtual);
    const deltaVelocidade = fps < 90 ? 2 : 1;
    Estado.velocidade = deltaVelocidade;
    /* ´executar´ é um parâmetro onde se espera como argumento uma função que execute recursivamente uma lista de funções
        Esse é o momento onde serão executados no loop o menu principal, e a fase */
    executar(listaFuncoes);
    window.requestAnimationFrame(loopJogo(execFuncoes)(listaFuncoes)(tempoNovo)); // Loop recursivo
};

/*  Primeira chamada do loop. Ele só será iniciado após a página carregar todos os assets
    Isso é necessário pois, caso o loop se inicie antes, as imagens não serão exibidas */
logo.onload = () => window.requestAnimationFrame(loopJogo(execFuncoes)([...TELA_INICIAL, ...JOGO])(tempoAtual));