/* Referências: 
      https://github.com/chrokh/fp-games 
*/

const canvas = document.getElementById("dinoPP");
const ctx = canvas.getContext("2d");

/* -------------------------------------------------------------------------- */
/*                                   ASSETS                                   */
/* -------------------------------------------------------------------------- */

const logo = Cenario.criarImagem("assets/image/logo (3).png")();
const perdeuAudio = Cenario.criarAudio("assets/hurt.mp3");
const puloAudio = Cenario.criarAudio("assets/beep.mp3");
const musicaAmbiente = Cenario.criarAudio("assets/ambiente.mp3");
musicaAmbiente.loop = true;
musicaAmbiente.volume = 0.3;
perdeuAudio.volume = 0.3
puloAudio.volume = 0.2;

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
    // if (estado.faseAtual > 0) return;
    // if (estado.faseAtual > 0) return;
    cenario.definirTamanho(ctx)(600)(300);
    const canvasTamanho = cenario.tamanho(ctx); // Tamanho do canvas
    const canvasCentro  = cenario.proporcao(1/2)(canvasTamanho); // Centro do canvas
    const logoDimensoes = cenario.proporcao(1/(window.devicePixelRatio * 500))({ x: logo.width, y: logo.height }); // Dimensões da imagem logo
    const logoPosicao   = cenario.proporcao(1/2)(logoDimensoes); // Posição da imagem logo
    // ctx.drawImage(logo, canvasCentro.x - logoPosicao.x, canvasCentro.y - logoPosicao.y, logoDimensoes.x, logoDimensoes.y); // Imprimir a logo
    ctx.shadowBlur = 0;
    ctx.shadowColor = "rgb(26, 255, 128)";
    ctx.drawImage(logo, logoDimensoes.x, logoDimensoes.y, canvasTamanho.x, canvasTamanho.y);

    ctx.closePath();
};

// Criar fase: jogador, obstáculos, potuação
const criarFase = (ctx) => (estado) => (cenario) => (jogador) => {
    if (estado.faseAtual < 1) return;
    /* Define o tamanho do canvas, 600x300 é o que decidimos usar */
    cenario.definirTamanho(ctx)(600)(300);

    /*  A pontuação do jogador deve ser normalizada, 
        pois ela é atualizada pelo loop inúmeras vezes 
        por segundo, fazendo com que a última casa seja 
        atualizada rápido demais, dificultando a visualização
        
        Para isso, apenas usaremos substring para remover
        o último caractere do texto */
    const pontuacao = estado.pontuacao.toString();
    const pontuacaoNormalizada = pontuacao.substring(0, pontuacao.length - 1);

    /*  Usado para preencher listas de obstáculos e
        habilidades. Deve ser passado como parâmetro,
        o tamanho e a função que será executada.

        No caso, nossas funções devem poder receber
        o index como parâmetro. Isso vai ajudar a
        ordenar os obstáculos gerados */
    const preencherLista = (tamanho) => (exec) => Array(tamanho).fill().map((_v, index) => exec(index));

    /*  Esta função será chamada para remover certo
        elemento de uma lista. O uso padrão será para
        remover obstáculos e habilidades que já estão
        fora da visão do jogador */
    const removerElemento = (qnt) => (lista) => lista.slice(qnt);
    const removerPrimeiroElemento = removerElemento(1);

    /* Criando 5 obstáculos padrões */
    const criarObstaculos = () => preencherLista(5)((index) => cenario.criarObstaculo(estado.semente() * 200)(index)(0));
    const criarHabilidades = () => preencherLista(1)(() => cenario.criarObstaculo(estado.semente() * 500)(2)(0));

    /*  Para checar se algo está fora da área de visão,
        comparamos a posição do elemento com um dos lados 
        do canvas. No caso, usaremos 0, que representa o 
        lado esquerdo da tela. 
        
        Como a posição do objeto é sempre um ponto que
        representa o lado superior esquerdo do elemento,
        devemos também diminuir 0 pela largura do objeto

        Por exemplo, se quisermos saber se um objeto de
        50px de largura está fora da tela, temos que:

            Quando a posição do elemento for 0, o lado
            esquerdo do elemento está no limite da área
            de visão

            Quando -50 < posição < 0, o elemento está
            parcialmente fora do canvas

            Quando a posição < -50, a totalidade do
            elemento está fora da área de visão */
    const estaForaDaTela = (posicao) => (tamanho) => posicao < 0 - tamanho; 

    /*  Para checar se um objeto está em colisão com
        o jogador, checamos se a posição do jogador
        está em conflito com a posição do elemento */
    const checarColisao = (jogador) => (obstaculo) => (tamanhoJogador) => (tamanhoObstaculo) => jogador.x + tamanhoJogador.x >= obstaculo.x && jogador.y + tamanhoJogador.y >= obstaculo.y && obstaculo.x + tamanhoObstaculo.x >= jogador.x && obstaculo.y + tamanhoObstaculo.y >= jogador.y;

    // estado.obstaculos = Array(5).fill().map((valor, index) => cenario.criarObstaculo((estado.semente() + 1) * 200)(index+1)(window.innerWidth));
    if (estado.obstaculos.length === 0) estado.obstaculos = criarObstaculos();
    if (estado.habilidades.length === 0) estado.habilidades = criarHabilidades();
    
    // Caso o primeiro obstáculo da lista esteja fora da tela, remover da lista e criar um novo
    if (estaForaDaTela(estado.obstaculos[0].x)(estado.tamanhoInicialObstaculos.x)) {
        estado.obstaculos = removerPrimeiroElemento(estado.obstaculos);
        estado.obstaculos.push(cenario.criarObstaculo(estado.semente() * 200)(3)(0));
    };

    // Caso a primeira habilidade da lista esteja fora da tela, remover da lista e criar uma nova
    if (estaForaDaTela(estado.habilidades[0].x)(estado.tamanhoInicialHabilidades.x)) {
        estado.habilidades = removerPrimeiroElemento(estado.habilidades);
        estado.habilidades.push(cenario.criarObstaculo((estado.semente() + 1) * 200)(5)(0));
    }

    const canvasTamanho = cenario.tamanho(ctx);
 
    // Mapeia os obstáculos para serem impressos e retorna uma nova posição para eles
    estado.obstaculos = estado.obstaculos.map((valor, index) => {
        const posicao = { x: valor.x * estado.velocidadeInicial, y: valor.y };
        cenario.desenharObstaculo(ctx)({ x: 25, y: 50 })(posicao);
        if (checarColisao(jogador.posicao)(posicao)(jogador.tamanho)(estado.tamanhoInicialObstaculos)) {
            musicaAmbiente.pause();
            perdeuAudio.play();
            Estado.pausado = true;
            setTimeout(() => { document.location.reload(); }, 1000);
        };
        return { ...valor, x: valor.x - estado.velocidade };
    });

    // Mapeia as habilidades para serem impressos e retorna uma nova posição para elas
    estado.habilidades = estado.habilidades.map((valor, index) => {
        cenario.desenharHabilidade(ctx)({ x: 25, y: 25 })({ x: valor.x * estado.velocidadeInicial, y: valor.y });
        return { ...valor, x: valor.x - estado.velocidade };
    });

    jogador.pular(estado.alturaPulo)(estado.velocidade); // Define a altura do pulo
    jogador.desenhar(ctx)(jogador.posicao)(jogador.tamanho); // Imprimir jogador
    cenario.desenharChao(ctx);
     // Preparar texto de pontuação
    const exibirPontuacao = cenario.formatarTexto(ctx)(16)("right")("#FDFCFC");
    exibirPontuacao.fillText(`PONTUAÇÃO ${pontuacaoNormalizada}`, canvasTamanho.x, 10);
    ctx.closePath();
};

/* -------------------------------------------------------------------------- */
/*                                   EVENTOS                                  */
/* -------------------------------------------------------------------------- */

/* Evento acionado quando uma tecla é pressionada
    Dentro, podemos gerenciar ações como a de pular, 
    ou iniciar a partida */
window.addEventListener("keydown", (e) => { 
    if (e.code != "Space" || Estado.faseAtual == -1 || Jogador.estaEmAnimacao || Jogador.estaPulando)  return;
    if (Estado.faseAtual == 0) {
        document.getElementById("comecarAJogar").style.visibility = "hidden";
        Estado.faseAtual = 1;
        musicaAmbiente.play();
    }
    else {
        puloAudio.play();
        Jogador.estaPulando = true;
    }
}, false);

/*  Evento acionado quando a janela é redimensionada
    Quando alterado o tamanho da página, o cenário 
    deve ser recarregado para evitar erros */
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

    const tempoNovo       = new Date;
    const fps             = 1000 / (tempoNovo - tempoAtual);
    Estado.velocidade     = fps < 90 ? 2 : 1;

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
