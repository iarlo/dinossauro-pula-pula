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
    cenario.definirTamanho(ctx)(600)(300);
    const canvasTamanho = cenario.tamanho(ctx); // Tamanho do canvas
    const canvasCentro  = cenario.proporcao(1/2)(canvasTamanho); // Centro do canvas
    const logoDimensoes = cenario.proporcao(1/(window.devicePixelRatio * 500))({ x: logo.width, y: logo.height }); // Dimensões da imagem logo
    const logoPosicao   = cenario.proporcao(1/2)(logoDimensoes); // Posição da imagem logo
    // ctx.drawImage(logo, canvasCentro.x - logoPosicao.x, canvasCentro.y - logoPosicao.y, logoDimensoes.x, logoDimensoes.y); // Imprimir a logo
    ctx.drawImage(logo, logoDimensoes.x, logoDimensoes.y, canvasTamanho.x, canvasTamanho.y);

    ctx.closePath();
};

// Criar fase: jogador, obstáculos, potuação
const criarFase = (ctx) => (estado) => (cenario) => (jogador) => {
    if (estado.faseAtual < 1) return;

    cenario.definirTamanho(ctx)(600)(300);

    const pontuacao = estado.pontuacao.toString();
    const pontuacaoNormalizada = pontuacao.substring(0, pontuacao.length - 1);

    const preencherLista = (tamanho) => (exec) => Array(tamanho).fill().map((_v, index) => exec(index));
    const removerElemento = (qnt) => (lista) => lista.slice(qnt);
    const removerPrimeiroElemento = removerElemento(1);

    const criarObstaculos = () => preencherLista(5)((index) => cenario.criarObstaculo(estado.semente() * 200)(index)(0));
    const criarHabilidades = () => preencherLista(1)(() => cenario.criarObstaculo(estado.semente() * 500)(2)(0));

    const estaForaDaTela = (posicao) => (tamanho) => posicao < 0 - tamanho; 

    // estado.obstaculos = Array(5).fill().map((valor, index) => cenario.criarObstaculo((estado.semente() + 1) * 200)(index+1)(window.innerWidth));
    if (estado.obstaculos.length === 0) estado.obstaculos = criarObstaculos();
    if (estado.habilidades.length === 0) estado.habilidades = criarHabilidades();
    
    // Caso o primeiro obstáculo da lista esteja fora da tela, remover da lista e criar um novo
    if (estaForaDaTela(estado.obstaculos[0].x)(estado.tamanhoInicialObstaculos.x)) {
        estado.obstaculos = removerPrimeiroElemento(estado.obstaculos);
        estado.obstaculos.push(cenario.criarObstaculo(estado.semente() * 200)(2)(-200));
    };

    // Caso a primeira habilidade da lista esteja fora da tela, remover da lista e criar uma nova
    if (estaForaDaTela(estado.habilidades[0].x)(estado.tamanhoInicialHabilidades.x)) {
        estado.habilidades = removerPrimeiroElemento(estado.habilidades);
        estado.habilidades.push(cenario.criarObstaculo((estado.semente() + 1) * 200)(5)(0));
    }

    const canvasTamanho = cenario.tamanho(ctx);
    // if (Jogador.posicao.y === -1) Jogador.posicao.y = ctx.canvas.height / 2;
 
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

    jogador.pular(estado.alturaPulo); // Define a altura do pulo
    jogador.desenhar(ctx)(jogador.posicao)(jogador.tamanho); // Imprimir jogador
     // Preparar texto de pontuação
    const exibirPontuacao = cenario.formatarTexto(ctx)(16)("right")("black");
    exibirPontuacao.fillText(pontuacaoNormalizada, canvasTamanho.x, 10);
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

/*  As duas constantes seguintes são uma lista contendo as funções necessárias 
    para exibir o jogo. A lista `TELA_INICIAL` contém a função que gera o menu 
    principal. Em paralelo, a lista `JOGO` contém a função que gera a fase */
const TELA_INICIAL = [ () => criarMenu(ctx)(logo)(Cenario) ];
const JOGO = [ () => criarFase(ctx)(Estado)(Cenario)(Jogador) ];

const loopJogo = (executar) => (listaFuncoes) => (tempoAtual) => (tempo) => {
    /*  ** Infelizmente, até o momento não encontramos uma forma de gerenciar 
        estados sem quebrar o paradigma funcional. Seguiremos buscando */
    if (Estado.faseAtual == -1) Estado.faseAtual = 0;
    if (Estado.faseAtual > 0) Estado.pontuacao += 1;

    /*  Compara o tempo anterior com o tempo atual a cada loop nos fornece o FPS
        Enquanto estavamos desenvolvendo o jogo, percebemos que diferentes telas
        geravam diferentes taxas de frames por segundo. Pelo fato de usarmos uma
        velocidade constante para movimentar objetos e pulos do jogador, notamos
        que mesmo sendo uma constante, a velocidade variava devido a frequência
        dos monitores.
        
        Por exemplo, digamos que nossa velocidade é 2; Em nosso jogo, velocidade 
        é um multiplicador, onde `posicao += 1 * velocidade`
        A função nativa requestAnimationFrame tenta se autoexecutar x vezes de 
        forma que x seja aproximadamente a mesma frquência do monitor
        
        Então, percebemos que em monitores de 60hz, mesmo tendo velocidade 
        constante 2, o jogador pulava mais lento pois a função se autoexecutava 
        60 vezes por segundo, enquanto em monitores de 120hz, a velocidade dobrava 
        
        Nossa solução foi, infelizmente, quebrar o paradigma, e tornar a velocidade
        uma variavel em função da frequência do monitor

        Caso fps < 90, então, velocidade = 2, senão, velocidade = 1; */

    const tempoNovo = new Date;
    const fps       = 1000 / (tempoNovo - tempoAtual);
    const deltaVelocidade = fps < 90 ? 2 : 1;
    Estado.velocidade = deltaVelocidade;

    /* ´executar´ é um parâmetro onde se espera como argumento uma função que execute 
        recursivamente uma lista de funções. Esse é o momento onde serão executados
        no loop o menu principal, e a fase */
    if (!Estado.pausado) executar(listaFuncoes);

    /* Aqui é onde acontece o loop, a cada chamada da função, ela chamará a si mesma novamente */
    window.requestAnimationFrame(loopJogo(execFuncoes)(listaFuncoes)(tempoNovo));
};

/*  Primeira chamada do loop. Ele só será iniciado após a página carregar todos os assets
    Isso é necessário pois, caso o loop se inicie antes, as imagens não serão exibidas */
logo.onload = () => window.requestAnimationFrame(loopJogo(execFuncoes)([...TELA_INICIAL, ...JOGO])(tempoAtual));

