/* eslint-disable prettier/prettier */
const canvas = document.getElementById('dinoPP');
const ctx = canvas.getContext('2d');

// ─── Utilidades ──────────────────────────────────────────────────────────────

/*	Para checar se um objeto está em colisão com o jogador, checamos se a
	posição do jogador está em conflito com a posição do elemento */
const checarColisao = (posicaoJogador) => (posicaoObstaculo) => (tamanhoJogador) => (tamanhoObstaculo) =>
	posicaoJogador.x + tamanhoJogador.x >= posicaoObstaculo.x &&
	posicaoJogador.y + tamanhoJogador.y >= posicaoObstaculo.y &&
	posicaoObstaculo.x + tamanhoObstaculo.x >= posicaoJogador.x &&
	posicaoObstaculo.y + tamanhoObstaculo.y >= posicaoJogador.y;

/* 	Cria e retorna um elemento HTML do tipo Audio */
const criarAudio = (caminho) => {
	const audio = new Audio(caminho);
	return audio;
};

/* 	Cria e retorna um elemento HTML do tipo Image */
const criarImagem = (caminho) => {
	const imagem = new Image();
	imagem.src = caminho;
	return imagem;
};

/*	Coleção das funções definidas anteriormente */
const utilidades = {
	checarColisao,
	criarAudio,
	criarImagem,
};

// ─── Assets ──────────────────────────────────────────────────────────────────

const assets = [
	{
		tipo: 'imagem',
		nome: 'logo',
		caminho: 'assets/image/logo (3).png',
	},
	{
		tipo: 'imagem',
		nome: 'cactus_1',
		caminho: 'assets/image/cactus1.png',
	},
	{
		tipo: 'imagem',
		nome: 'cactus_2',
		caminho: 'assets/image/cactus2.png',
	},
	{
		tipo: 'imagem',
		nome: 'cactus_1_invertido',
		caminho: 'assets/image/cactus1_invertido.png',
	},
	{
		tipo: 'imagem',
		nome: 'cactus_2_invertido',
		caminho: 'assets/image/cactus2_invertido.png',
	},
	{
		tipo: 'audio',
		nome: 'fim_de_jogo',
		caminho: 'assets/hurt.mp3',
		volume: 0.3,
	},
	{
		tipo: 'audio',
		nome: 'pular',
		caminho: 'assets/beep.mp3',
		volume: 0.2,
	},
	{
		tipo: 'audio',
		nome: 'ambiente',
		caminho: 'assets/ambiente.mp3',
		volume: 0.3,
	},
];

// ─── Audio ───────────────────────────────────────────────────────────────────

/*	Caso necessário repetir automaticamente um áudio. Usado principalmente
	em sons ambientes. */
const adicionarFuncaoLoop = (audio) => Object.assign(audio, {
	criarLoop() {return Object.assign(audio, {loop: true});}
});

/*	Reiniciar o áudio é importante em certas situações
	Por exemplo: caso o jogador execute a ação de pular, e por algum motivo
	atualmente desconhecido, o áudio não termine de tocar antes que a ação
	seja executada novamente. Isso impediria que o segundo áudio iniciasse
	Portanto, espera-se que seja reiniciado antes de executar */
const adicionarFuncaoRepetir = (audio) => Object.assign(audio, {
	reiniciar() {return Object.assign(audio, {currentTime: 0});}
});


/*	Altera o volume de algum áudio para o parâmetro adicionado */
const normalizarVolume = (volume) => (audio) => Object.assign(audio, {volume})

/*	Recebe uma lista de modificadores e os executa no áudio. Em tese, vão
	ser usadas as funções `adicionarFuncaoLoop`, `adicionarFuncaoRepetir` e
	`normalizarVolume` na lista */
const modificarAudio = (modificadores) => (audio) => {
	const recursivo = (audio) => ([f, ...r]) => {
		if (typeof f == 'undefined') return audio;
		return f(recursivo(audio)(r));
	};

	return recursivo(audio)(modificadores);
};

// ─────────────────────────────────────────────────────────────────────────────

/*	Recebe uma lista, e separa seus elementos com base em certo filtro. Pensado
	inicialmente para separar imagens e áudios em duas listas diferentes.
	[[{tipo:imagem}], [{tipo:audio},{tipo:audio}]] */
const separarListaTipo = (filtro) => (lista) => lista.reduce(([x, y], v) => (v.tipo === filtro ? [[...x, v], y] : [x, [...y, v]]), [[], []]);

/*	Caso o asset seja imagem, é chamada a função `criarImagem` e retornado um
	elemento HTML. Caso seja áudio, é utilizado o parâmetro `m`, que deve ser
	uma função que modifique o áudio de alguma forma. */
const gerarFuncaoAssets = (m) => (v) => v.tipo === 'imagem' ? utilidades.criarImagem(v.caminho) : m(utilidades.criarAudio(v.caminho));

const listaAssets = separarListaTipo('imagem')(assets);
const listaAudioMods = [adicionarFuncaoLoop, adicionarFuncaoRepetir];

const [imagens, audios] = listaAssets.map((v) =>
	v.map((w) =>
		gerarFuncaoAssets(
			modificarAudio([normalizarVolume(w.volume || 1), ...listaAudioMods]),
		)(w),
	),
);

const [perdeuAudio, audioPular, audioAmbiente] = audios;

// ─── Jogo ────────────────────────────────────────────────────────────────────

/*	Tempo da primeira execução. Necessário para medir a taxa de atualização */
const tempoAtual = new Date();

const estado_ = Estado;

// ─────────────────────────────────────────────────────────────────────────────

/*  Aqui onde é criado o menu principal.
	Impressão da logo e mensagem. */
const criarMenu = (ctx) => (logo) => (cenario) => {
	// If (estado.faseAtual > 0) return;
	// if (estado.faseAtual > 0) return;
	cenario.definirTamanho(ctx)(600)(300);
	const canvasTamanho = cenario.tamanho(ctx); // Tamanho do canvas
	const canvasCentro = cenario.proporcao(1 / 2)(canvasTamanho); // Centro do canvas
	const logoDimensoes = cenario.proporcao(1 / (window.devicePixelRatio * 500))({x: logo.width, y: logo.height}); // Dimensões da imagem logo
	const logoPosicao = cenario.proporcao(1 / 2)(logoDimensoes); // Posição da imagem logo
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

	// Estado.obstaculos = Array(5).fill().map((valor, index) => cenario.criarObstaculo((estado.semente() + 1) * 200)(index+1)(window.innerWidth));
	if (estado.obstaculos.length === 0) estado.obstaculos = criarObstaculos();
	if (estado.habilidades.length === 0) estado.habilidades = criarHabilidades();

	// Caso o primeiro obstáculo da lista esteja fora da tela, remover da lista e criar um novo
	if (estaForaDaTela(estado.obstaculos[0].x)(estado.tamanhoInicialObstaculos.x)) {
		estado.obstaculos = removerPrimeiroElemento(estado.obstaculos);
		estado.obstaculos.push(cenario.criarObstaculo(estado.semente() * 200)(3)(0));
	}

	;

	// Caso a primeira habilidade da lista esteja fora da tela, remover da lista e criar uma nova
	if (estaForaDaTela(estado.habilidades[0].x)(estado.tamanhoInicialHabilidades.x)) {
		estado.habilidades = removerPrimeiroElemento(estado.habilidades);
		estado.habilidades.push(cenario.criarObstaculo((estado.semente() + 1) * 200)(5)(0));
	}

	const canvasTamanho = cenario.tamanho(ctx);

	// Mapeia os obstáculos para serem impressos e retorna uma nova posição para eles
	estado.obstaculos = estado.obstaculos.map((valor, index) => {
		const posicao = {x: valor.x * estado.velocidadeInicial, y: valor.y};
		cenario.desenharObstaculo(ctx)({x: 25, y: 50})(posicao);


		const colisaoObjetos = () => {
			if (Jogador.invencivel == false) {
				if (checarColisao(jogador.posicao)(posicao)(jogador.tamanho)(estado.tamanhoInicialObstaculos)) {
					musicaAmbiente.pause();
					perdeuAudio.play();
					Estado.pausado = true;
					setTimeout(() => {document.location.reload();}, 1000);
				}

				;
			} else { }
		}

		colisaoObjetos();
		return {...valor, x: valor.x - estado.velocidade};
	});

	// Mapeia as habilidades para serem impressos e retorna uma nova posição para elas
	estado.habilidades = estado.habilidades.map((valor, index) => {
		const posicao = {x: valor.x * estado.velocidadeInicial, y: valor.y}
		cenario.desenharHabilidade(ctx)({x: 25, y: 25})(posicao);

		// Colisão com habilidade: funcionando
		if (checarColisao(jogador.posicao)(posicao)(jogador.tamanho)(estado.tamanhoInicialHabilidades)) {
			/* Sumir Habilidade assim que tocar nela e gerar outra: ainda não está funcionando
				estado.habilidades = removerPrimeiroElemento(estado.habilidades);
				estado.habilidades.push(cenario.criarObstaculo((estado.semente() + 1) * 200)(5)(0));
			*/

			const invencibilidade = () => {
				Jogador.invencivel = true;

				setTimeout(() => {Jogador.invencivel = false}, 5000);
			}

			// ListaHabilidades e decidirHabilidade fica em estado ou global?
			const listaHabilidades = [invencibilidade()];// , inverterJogo()
			const decidirHabilidade = (lista) => {
				// Gera um índice aleatório
				const indiceAleatorio = Math.floor(Math.random() * lista.length);
				// Usa o índice para acessar o valor aleatório
				const valorAleatorio = lista[indiceAleatorio];
				return valorAleatorio;
			}

			decidirHabilidade(listaHabilidades);
			// Se invencibilidade() ativada:
			// Jogador.invencivel = true;
			// setTimeout(() => { Jogador.invencivel = false }, 5000);
		}

		return {...valor, x: valor.x - estado.velocidade};
	});

	jogador.pular(estado.alturaPulo)(estado.velocidade); // Define a altura do pulo
	jogador.ir(estado.distanciaAndar)(estado.distanciaAndar);
	jogador.voltar(estado.distanciaAndar)(estado.distanciaAndar);
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
	if (e.code != "Space" || Estado.faseAtual == -1 || Jogador.estaEmAnimacao || Jogador.estaPulando) return;
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

window.addEventListener("keydown", (e) => {
	if (e.code == "ArrowRight" && Estado.faseAtual == 1) {
		puloAudio.play();
		Jogador.estaIndo = true;
	}

	if (e.code == "ArrowLeft" && Estado.faseAtual == 1) {
		puloAudio.play();
		Jogador.estaVoltando = true;
	}
}, false);

window.addEventListener("keyup", e => {
	if (e.code == "ArrowRight" && Estado.faseAtual == 1) {
		Jogador.estaIndo = false;
	}

	if (e.code == "ArrowLeft" && Estado.faseAtual == 1) {
		Jogador.estaVoltando = false;
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

// ─── Loop Do Jogo ────────────────────────────────────────────────────────────

const loopJogo = (estadoInicial) => (tempoAtual) => (assets) => (menu) => (fase) => (_tempo) => {
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

		Nossa solução foi um colocar a velocidade em função da frequência da tela

		Caso fps < 90, então, velocidade = 2, senão, velocidade = 1; */
	const tempoNovo = new Date();
	const fps = 1000 / (tempoNovo - tempoAtual);

	/* 	Se o jogador perder, a página é reiniciada */
	if (estadoInicial.perdeu) {
		assets.audio.audioAmbiente.pause();
		assets.audio.perdeuAudio.play();
		estadoInicial.pausado = true;
		setTimeout(() => document.location.reload(), 1000);
	}

	/* 	Se o jogo estiver pausado, o loop também será */
	if (estadoInicial.pausado) {
		return 0;
	}

	/*	Criando um estado alterado */
	const estadoAlterado = {
		...estadoInicial,
		pontuacaoAtual:
			estadoInicial.faseAtual > 0
				? estadoInicial.pontuacaoAtual + 1
				: estadoInicial.pontuacaoAtual,
		fpsVelocidade: fps < 90 ? 2 : 1,
	};

	/* 	Para tornar o mais funcional possível, nosso estado será o retorno da função
		anterior.
		estado1 > fase(estado1) > estado2 > loop(estado2)
		E assim, em loop, o `estado2` será tomado como estado inicial `estado1` */
	menu();
	const estadoFase = fase(estadoAlterado);

	/* 	Aqui é onde acontece o loop, a cada chamada da função, ela chamará a si mesma novamente */
	return window.requestAnimationFrame(
		loopJogo(estadoFase ? estadoFase : estadoInicial)(tempoNovo)(assets)(menu)(fase),
	);
};

/*  Primeira chamada do loop. Ele só será iniciado após a página carregar todos
	os assets. Isso é necessário pois, caso o loop se inicie antes, as imagens
	não serão exibidas */
((imagens) => (audios) => async () => {
	const loadImage = (img) => new Promise((res, rej) => Object.assign((img), {onload(e) {res(this)}, onerror: rej}));

	/*	O jogo só deve ser iniciado após todas as imagens estejam carregadas */
	const assetsImagens = await Promise.all(imagens.map(loadImage));

	const loop = loopJogo(estado_)(tempoAtual)({imagem: assetsImagens, audio: audios});
	const menu = () => criarMenu(ctx)(assetsImagens[0])(utilidades);
	const fase = criarFase(ctx)(utilidades)(imagens);

	return window.requestAnimationFrame(loop(menu)(fase));
})(imagens)({perdeuAudio, audioPular, audioAmbiente})()
