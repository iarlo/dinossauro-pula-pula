/* eslint-disable complexity */
/* eslint-disable prettier/prettier */
/*
Notas: Ao decorrer do desenvolvimento desse projeto, tentamos de várias
formas minimizar a quebra do paradigma funcional. É meio complicado fazer
isso nesse contexto, pois um jogo necessita de gerenciamento de estados.

Foi interessante e ao mesmo tempo desafiador fazer parte desse projeto,
e antes que seja avaliado o código, gostaria de fazer uma breve introdução
às nossas escolhas e qual caminho decidimos seguir.

Inicialmente, buscamos referências (Listadas ao fim da nota), mas notamos
que o gerencialmento de estado quebrava o princípio de imutabilidade. Nós
decidimos então, abrir mão de alguns princípios em troca de usabilidade.
Tivemos uma ideia diferente das referências às quais somos gratos, pois
foi um guia necessário para nós que nunca fizemos um projeto do tipo. No
meio do desenvolvimento, ao vermos o loop do jogo funcionando, pensamos
que talvez seria interessante passar o estado como parâmetro da função
loop, e ao invés de alterar o estado atual, criar um novo a cada chamada.
Isso preservaria um pouco a imutabilidade, então foi o que decidimos fazer,
mesmo que não seja totalmente preservada.

Ao criarmos os eventos, notamos que para pular, o estado precisaria ser
atualizado por fora do loop, quebrando a imutabilidade. Infelizmente, não
conseguimos encontrar uma solução adequada para resolver isso. Nosso máximo
foi minimizar os efeitos, passando alguns eventos para dentro do loop. Em
nossas pesquisas, encontramos uma explicação de como o navegador lida com
vários eventos identicos sendo criados, e bom, não há leak de memória pois
o navegador simplesmente exclui ou ignora eventos iguais. Infelizmente isso
de gerar o evento dentro do loop deu certo para começar o jogo, mas não
atualizava o estado ao pular. Não encontramos uma solução a tempo e por isso
voltamos ao simples, definindo eventos no escopo global.

Infelizmente, não foi possível ser totalmente fiel ao paradigma funcional,
mas tentamos ao máximo.

Referências:
	- https://github.com/chrokh/fp-games
	- https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Multiple_identical_event_listeners
*/

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

/*	Função usada para gerar um obstáculo em um local aleatório baseado numa
	posição de elemento em uma lista, multiplicado por j */
const criarObstaculo = (i) => (j) => ({ x: ((i + 1) / 2 * (j + 200)), y: 1 })

/*	Cria e imprime um texto. Não pode ser muito alterado pois nós decidimos
	padronizar todos os textos */
const criarTexto = (ctx) => (tamanho) => (cor) => (texto) => (alinhar) => ({ x, y }) => {
	ctx.fillStyle = cor;
	ctx.textAlign = alinhar;
	ctx.textBaseline = 'middle';
	ctx.font = `${tamanho}pt VT323, monospace`;
	ctx.shadowBlur = 7;
	ctx.shadowColor = cor;
	return ctx.fillText(texto, x, y);
};

/* 	Define o tamanho do canvas para uma escala baseada na taxa de pixels do
	dispositivo. Essa etapa é necessária para impedir que textos e desenhos
	fiquem com aspecto borrado e de baixa qualidade. 600x300 é o padrão que
	decidimos usar */
const definirTamanhoDoCanvas = (ctx) => (width) => (height) => {
	const escala = (x) => Math.floor(x * window.devicePixelRatio);
	ctx.canvas.width = escala(width);
	ctx.canvas.height = escala(height);
	return ctx;
};

/*	Desenhar uma linha reta entre dois pontos */
const desenharLinha = (ctx) => (cor) => (x1) => (x2) => (y1) => (y2) => {
	ctx.strokeStyle = cor;
	ctx.shadowBlur = 7;
	ctx.shadowColor = cor;
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	return ctx.stroke();
}

/*	Permite imprimir tanto obstáculos, quanto habilidades mudando parâmetros */
const desenharObstaculo = (ctx) => (cor) => (img) => (tamanho) => (posicao) => (invertido) => {
	ctx.fillStyle = cor;
	ctx.shadowBlur = 7;
	ctx.shadowColor = cor;
	// Ctx.fillRect(posicao.x, posicao.y, tamanho.x, tamanho.y)
	const desenhar = (ctx) => (posicao) => ctx.drawImage(img, posicao.x, posicao.y, img.width, img.height);

	if (invertido) {
		ctx.save();
		ctx.translate(img.width, img.height);
		ctx.rotate(Math.PI);
		desenhar(ctx)({ x: -posicao.x, y: -posicao.y });
		return ctx.restore();
	}

	return desenhar(ctx)({ x: posicao.x, y: posicao.y });
}

/*  Para checar se algo está fora da área de visão, comparamos a posição do
	elemento com um dos lados do canvas. No caso, usaremos 0, que representa
	o lado esquerdo da tela.

	Como a posição do objeto é sempre um ponto que representa o lado superior
	esquerdo do elemento, devemos também diminuir 0 pela largura do objeto

	Por exemplo, se quisermos saber se um objeto de 50px de largura está fora
	da tela, temos que:

	-	Quando a posição do elemento for 0, o lado esquerdo do elemento está
		no limite da área de visão
	-	Quando -50 < posição < 0, o elemento está parcialmente fora do canvas
	-	Quando a posição < -50, a totalidade do elemento está fora da visão */
const estaForaDaTela = (posicao) => (tamanho) => posicao < 0 - tamanho;

/*  Usado para preencher listas de obstáculos e habilidades. Deve ser passado
	como parâmetro, o tamanho e a função que será executada.
	No caso, nossas funções devem poder receber o index como parâmetro. Isso
	vai ajudar a ordenar os obstáculos gerados */
const preencherLista = (tamanho) => (exec) => Array(tamanho).fill().map((_v, index) => exec(index));

/*	Caso necessário alterar proporcionalmente alguma coordenada, será usado
	o parâmetro `m` como multiplicador e { x, y } as coordenadas tratadas */
const proporcaoCoordenada = (m) => ({ x, y }) => ({ x: x * m, y: y * m });

/* 	Para aleatorizar a posição de obstáculos e habilidades, é preciso abrir
	mão da pureza da função onde esta será implementada */
const sementeAleatoria = () => Math.floor(Math.random() * 200) + 100;

/*	Consulta o tamanho atual do canvas com base no contexto */
const tamanhoCanvas = (ctx) => ({ x: ctx.canvas.clientWidth, y: ctx.canvas.clientHeight });

/*	Coleção das funções definidas anteriormente */
const utilidades = {
	checarColisao,
	criarAudio,
	criarImagem,
	criarObstaculo,
	criarTexto,
	definirTamanhoDoCanvas,
	desenharLinha,
	desenharObstaculo,
	estaForaDaTela,
	preencherLista,
	proporcaoCoordenada,
	sementeAleatoria,
	tamanhoCanvas
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
		tipo: 'imagem',
		nome: 'nuvem',
		caminho: 'assets/image/nuvem.png',
	},
	{
		tipo: 'imagem',
		nome: 'nuvem_1',
		caminho: 'assets/image/nuvem_1.png',
	},
	{
		tipo: 'imagem',
		nome: 'nuvem_2',
		caminho: 'assets/image/nuvem_2.png',
	},
	{
		tipo: 'imagem',
		nome: 'jogador_0',
		caminho: 'assets/image/dinossauro/0.png',
	},
	{
		tipo: 'imagem',
		nome: 'jogador_1',
		caminho: 'assets/image/dinossauro/1.png',
	},
	{
		tipo: 'imagem',
		nome: 'jogador_2',
		caminho: 'assets/image/dinossauro/2.png',
	},
	{
		tipo: 'imagem',
		nome: 'jogador_0_invertido',
		caminho: 'assets/image/dinossauro/0_invertido.png',
	},
	{
		tipo: 'imagem',
		nome: 'jogador_1_invertido',
		caminho: 'assets/image/dinossauro/1_invertido.png',
	},
	{
		tipo: 'imagem',
		nome: 'jogador_2_invertido',
		caminho: 'assets/image/dinossauro/2_invertido.png',
	},
	{
		tipo: 'imagem',
		nome: 'habilidade',
		caminho: 'assets/image/habilidade.png',
	},
	{
		tipo: 'imagem',
		nome: 'habilidade_invertido',
		caminho: 'assets/image/habilidade_invertido.png',
	},
	{
		tipo: 'imagem',
		nome: 'nuvem_invertido',
		caminho: 'assets/image/nuvem_invertido.png',
	},
	{
		tipo: 'imagem',
		nome: 'nuvem_1_invertido',
		caminho: 'assets/image/nuvem_1_invertido.png',
	},
	{
		tipo: 'imagem',
		nome: 'nuvem_2_invertido',
		caminho: 'assets/image/nuvem_2_invertido.png',
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
	{
		tipo: 'audio',
		nome: 'explosao',
		caminho: 'assets/explosion.mp3',
		volume: 0.5,
	},
];

// ─── Audio ───────────────────────────────────────────────────────────────────

/*	Caso necessário repetir automaticamente um áudio. Usado principalmente
	em sons ambientes. */
const adicionarFuncaoLoop = (audio) => Object.assign(audio, {
	criarLoop() { return Object.assign(audio, { loop: true }); }
});

/*	Reiniciar o áudio é importante em certas situações
	Por exemplo: caso o jogador execute a ação de pular, e por algum motivo
	atualmente desconhecido, o áudio não termine de tocar antes que a ação
	seja executada novamente. Isso impediria que o segundo áudio iniciasse
	Portanto, espera-se que seja reiniciado antes de executar */
const adicionarFuncaoRepetir = (audio) => Object.assign(audio, {
	reiniciar() { return Object.assign(audio, { currentTime: 0 }); }
});


/*	Altera o volume de algum áudio para o parâmetro adicionado */
const normalizarVolume = (volume) => (audio) => Object.assign(audio, { volume })

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

const [perdeuAudio, audioPular, audioAmbiente, audioExplosao] = audios;

// ─── Jogo ────────────────────────────────────────────────────────────────────

/*	Tempo da primeira execução. Necessário para medir a taxa de atualização */
const tempoAtual = new Date();

const criarEstadoInicial = () => ({
	alturaPulo: (alturaCanvas) => (alturaJogador) => alturaCanvas / 2 - alturaJogador,
	animacao: false,
	checarModificacoes: (estado) => Object.entries(estado.modificacoes).filter((v) => v[1]).length > 0,
	corAtual: 'rgb(26, 255, 128)',
	cores: {
		primaria: 'rgb(26, 255, 128)',
		invertida: 'rgb(255, 26, 244)'
	},
	descendo: false,
	faseAtual: 0,
	fpsVelocidade: 1,
	habilidadeTimer: 1111,
	//Lista de Modificações
	modificacoes: {
		intangivel: false,
		invertido: false,
		vidaExtra: false,
		setasDesbloqueadas: false,
	},
	modificacoesFuncoes: [
		// //Modificador de inversão de jogo
		(estado) => {
			if (estado.checarModificacoes(estado)) return false;
			console.log('[HABILIDADE] Invertendo jogo');
			estado.modificacoes.invertido = true;
			estado.pegouHabilidade = false;
			const jogadorNovoY = estado.alturaPulo(300)(estado.tamanhoJogador.y) + estado.tamanhoJogador.y * 2;
			setTimeout(() => {
				estado.modificacoes.invertido = false;
				return true;
			}, 9000);
			return { ...estado, posicaoJogador: { ...estado.posicaoJogador, y: jogadorNovoY } };
		},
		//Habilidade de vida extra
		(estado) => {
			if (estado.checarModificacoes(estado)) return false;
			console.log('[HABILIDADE] Vida extra');
			estado.modificacoes.vidaExtra = true;
			estado.pegouHabilidade = false;
			return estado;
		},
		//Habilidade de intangibilidade
		(estado) => {
			if (estado.checarModificacoes(estado)) return false;
			console.log('[HABILIDADE] Intangivel');
			estado.modificacoes.intangivel = true;
			estado.pegouHabilidade = false;

			setTimeout(() => {
				estado.modificacoes.intangivel = false;
				return true;
			}, 9000);
			return estado;
		},
		//Habilidade de se locomover para frente e para trás
		(estado) => {
			if (estado.checarModificacoes(estado)) return false;
			console.log('[HABILIDADE] Setas Desbloqueadas');
			estado.modificacoes.setasDesbloqueadas = true;

			const eventoHandler = (tipo) => (e) => {
				if (e.code === 'ArrowRight' || e.code === 'KeyD') {
					estado_.indo = tipo === 'keydown' ? true : false;
				}
				if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
					estado_.voltando = tipo === 'keydown' ? true : false;
				}
			}

			const pressionou = eventoHandler('keydown');
			const soltou = eventoHandler('keyup');

			window.addEventListener('keydown', pressionou);
			window.addEventListener('keyup', soltou);

			setTimeout(() => {
				estado.modificacoes.setasDesbloqueadas = false;
				window.removeEventListener('keydown', pressionou);
				window.removeEventListener('keyup', soltou);
				return true;
			}, 9000);
		}
	],
	multiplicadorVelocidade: 1,
	pausado: false,
	pegouHabilidade: false,
	perdeu: false,
	pontuacaoAtual: 0,
	posicaoHabilidades: [],
	posicaoJogador: { x: 50, y: 100 },
	posicaoNuvens: [],
	posicaoObstaculos: [],
	pulando: false,
	indo: false,
	voltando: false,
	spriteAtual: 0,
	spriteJogador: 0,
	tamanhoCanvas: { x: 600, y: 300 },
	tamanhoHabilidades: { x: 25, y: 25 },
	tamanhoJogador: { x: 25, y: 45 },
	tamanhoObstaculos: { x: 15, y: 50 },
	velocidade: 3.84,
});

const estado_ = criarEstadoInicial();

// ─────────────────────────────────────────────────────────────────────────────

/*  Aqui onde é criado o menu principal. Impressão e dimensionamento da logo e canvas */
const criarMenu = (ctx) => (logo) => (utilidades) => {
	/*	Para calcular as dimensões da logo, iremos dividir o tamanho original por
		1 / (taxaDePixels * 500). Isso vai impedir a imagem de ficar com um aspecto
		borrado, ou diferente da proposta de pixel arte */
	const logoDimensoes = utilidades.proporcaoCoordenada(1 / (window.devicePixelRatio * 500))({ x: logo.width, y: logo.height });
	const canvas = utilidades.definirTamanhoDoCanvas(ctx)(600)(300);
	const canvasTamanho = utilidades.tamanhoCanvas(canvas);

	return ctx.drawImage(logo, logoDimensoes.x, logoDimensoes.y, canvasTamanho.x, canvasTamanho.y); //	Impressão da logo
};

// Criar fase: jogador, obstáculos, potuação
const criarFase = (ctx) => (utilidades) => (assets) => (estado) => {
	/* 	Caso o jogador esteja no menu, não montar a fase */
	if (estado.faseAtual < 1) return false;

	const canvas = utilidades.definirTamanhoDoCanvas(ctx)(estado.tamanhoCanvas.x)(estado.tamanhoCanvas.y);
	const tamanhoCanvas = utilidades.tamanhoCanvas(canvas);

	/*  A pontuação do jogador deve ser normalizada, pois ela é atualizada pelo
		loop inúmeras vezes por segundo, fazendo com que a última casa seja
		atualizada rápido demais, dificultando a visualização

		Para isso, apenas usaremos substring para remover o último caractere do
		texto */
	const pontuacaoAtual = estado.pontuacaoAtual.toString();
	const maiorPontuacao = JSON.parse(localStorage['maiorPontuacao']).toString();

	const maiorPontuacaoNormalizada = maiorPontuacao.substring(0, maiorPontuacao.length - 1);
	const pontuacaoNormalizada = pontuacaoAtual.substring(0, pontuacaoAtual.length - 1);

	const habilidadeTimer = estado.habilidadeTimer.toString();
	const habilidadeTimerNormalizado = habilidadeTimer.substring(0, habilidadeTimer.length - 2);

	/*  Esta função será chamada para remover certo elemento de uma lista. O uso
		padrão será para remover obstáculos e habilidades que já estão fora da
		visão do jogador */
	const removerElemento = (qnt) => (lista) => lista.slice(qnt);
	const removerPrimeiroElemento = removerElemento(1);

	/* 	As duas funções a seguir retornam uma lista com `n` elementos, representando
		obstáculos ou habilidades */
	const criarObstaculos = () => utilidades.preencherLista(5)((index) => utilidades.criarObstaculo(index)(utilidades.sementeAleatoria()));
	const criarHabilidades = () => utilidades.preencherLista(1)(() => utilidades.criarObstaculo(2)(utilidades.sementeAleatoria() * estado.velocidade));
	const criarNuvens = () => utilidades.preencherLista(5)((index) => (utilidades.criarObstaculo(index + 3)(utilidades.sementeAleatoria() * 2))).map((v) => ({ tipo: 0, posicao: v }));
	/* 	Define a função de pular */
	const pular = (estado) => (posicaoInicial) => (altura) => (velocidade) => {
		const { pulando, descendo } = estado_;
		const pos = { ...estado.posicaoJogador, y: estado.modificacoes.invertido ? (estado.posicaoJogador.y < 105 ? 105 : estado.posicaoJogador.y) : (estado.posicaoJogador.y > 105 ? 105 : estado.posicaoJogador.y) };
		const { invertido } = estado.modificacoes;
		const deltaPosicao = 4 * velocidade;
		const subir = { ...pos, y: pos.y - deltaPosicao };
		const descer = { ...pos, y: pos.y + deltaPosicao * (descendo ? 1.3 : 1) };
		const posInicial = posicaoInicial.y + (invertido ? estado.tamanhoJogador.y : 0);
		const comecouPulo = invertido
			? pulando && pos.y < posInicial + altura - estado.tamanhoJogador.y + 3
			: pulando && pos.y > posInicial - altura;
		const estaNoAr = invertido
			? pos.y > posInicial - estado.tamanhoJogador.y
			: pos.y < posInicial;
		/*  Checa se o jogador está no ponto mais
			alto onde se pode chegar ao pular */
		const pontoLimite = invertido
			? pos.y >= posInicial + altura - estado.tamanhoJogador.y
			: pos.y <= posInicial - altura;

		if (descendo) estado_.pulando = false;

		if (comecouPulo) {
			estado_.animacao = true;
			estado.posicaoJogador = invertido ? descer : subir;
		}

		if (estaNoAr) {
			if (pontoLimite) {
				setTimeout(() => { estado_.pulando = false; return true; }, 150);
			}

			if (!pulando) estado.posicaoJogador = invertido ? subir : descer;
		}

		const estaNoChao = invertido
			? pos.y == posInicial - estado.tamanhoJogador.y
			: pos.y == posInicial;

		if (estaNoChao) {
			estado_.animacao = false;
			estado_.descendo = false;
		}

		return estado;
	}

	const andar = (estado) => (velocidade) => (posicaoInicial) => (limite) => {
		const mover = (posInicial) => (quantoMover) => ({ x: posInicial.x + quantoMover.x, y: posInicial.y + quantoMover.y });

		const indo = estado_.indo;
		const voltando = estado_.voltando;


		if (!estado.modificacoes.setasDesbloqueadas) return { ...posicaoInicial, x: 50 };
		if (!indo && !voltando) return posicaoInicial;

		return mover(posicaoInicial)({ x: (indo ? (posicaoInicial.x >= limite ? 0 : 4) : (posicaoInicial.x <= 0 ? 0 : -4)) * velocidade, y: 0 });
	}

	/*	Gera uma nova posição para elementos quando `inverter` está ativado */
	const posicaoInvertida = (estado) => (altura) => estado.tamanhoCanvas.y / 2 + altura

	/* 	Gera e retorna uma nova posição, além de senhar o elemento  */
	const novaPosicaoElemento = (valor) => (velocidade) => (img) => (imgInvertida) => (tamanho) => (colisao) => {
		const posicao = { x: valor.x * velocidade, y: estado.modificacoes.invertido ? posicaoInvertida(estado)(valor.y) : tamanhoCanvas.y / 2 - tamanho.y };
		if (utilidades.checarColisao(estado.posicaoJogador)(estado.modificacoes.invertido ? { ...posicao, y: posicao.y - tamanho.y } : posicao)(estado.tamanhoJogador)(tamanho)) colisao();
		utilidades.desenharObstaculo(ctx)(estado.corAtual)(estado.modificacoes.invertido ? imgInvertida : img)(tamanho)(posicao)(estado.modificacoes.invertido);
		return { ...valor, x: valor.x - estado.fpsVelocidade };
	}

	const alturaPulo = estado.alturaPulo(tamanhoCanvas.y)(estado.tamanhoJogador.y);

	const posAtualDosObstaculos = estado.posicaoObstaculos.length <= 1 ? estado.posicaoObstaculos.concat(criarObstaculos()) : estado.posicaoObstaculos;
	const posAtualDasHabilidades = estado.posicaoHabilidades.length == 0 ? estado.posicaoHabilidades.concat(criarHabilidades()) : estado.posicaoHabilidades;
	const posAtualDasNuvens = estado.posicaoNuvens.length <= 5 ? estado.posicaoNuvens.concat(criarNuvens()) : estado.posicaoNuvens;

	if (estado.pegouHabilidade) {
		estado.pegouHabilidade = false;
		estado.modificacoesFuncoes[Math.floor(Math.random() * estado.modificacoesFuncoes.length)](estado);
	}

	const segundoEstado = {
		...estado,
		velocidade: estado.velocidade + estado.pontuacaoAtual / 10000000,
		posicaoObstaculos: utilidades.estaForaDaTela(posAtualDosObstaculos[0].x)(estado.tamanhoObstaculos.x) ? removerPrimeiroElemento(posAtualDosObstaculos) : posAtualDosObstaculos,
		posicaoHabilidades: utilidades.estaForaDaTela(posAtualDasHabilidades[0].x)(estado.tamanhoHabilidades.x) ? removerPrimeiroElemento(posAtualDasHabilidades) : posAtualDasHabilidades,
		posicaoNuvens: posAtualDasNuvens.filter((v) => v.posicao.x > -25),
		corAtual: estado.modificacoes.invertido ? estado.cores.invertida : estado.cores.primaria,
		habilidadeTimer: estado.checarModificacoes(estado) ? estado.habilidadeTimer - 1 * estado.fpsVelocidade : 1111,
	}

	// Mapeia os obstáculos para serem impressos e retorna uma nova posição para eles
	const novaPosicaoObstaculos = segundoEstado.posicaoObstaculos.map((valor) => {
		const funcaoDeColisao = () => {
			//Testa se o dino está intangivel
			if (estado.modificacoes.intangivel == false) {
				segundoEstado.perdeu = true;
				return true
			} else {
				segundoEstado.perdeu = false;
				return false
			}
		};
		return novaPosicaoElemento(valor)(segundoEstado.velocidade)(assets[2])(assets[4])(segundoEstado.tamanhoObstaculos)(funcaoDeColisao);
	});

	// Mapeia as habilidades para serem impressos e retorna uma nova posição para elas
	const novaPosicaoHabilidades = segundoEstado.posicaoHabilidades.map((valor) => {
		const funcaoDeColisao = () => { segundoEstado.pegouHabilidade = true; return true; }

		return novaPosicaoElemento(valor)(segundoEstado.velocidade)(assets[15])(assets[15])(segundoEstado.tamanhoHabilidades)(funcaoDeColisao);
	});

	// Mapeia as nuvens para serem impressos e retorna uma nova posição para elas
	const novaPosicaoNuvens = segundoEstado.posicaoNuvens.map((valor) => {
		const altura = valor.posicao.y === 1 ? (Math.floor(Math.random() * (3 - 1 + 1) + 1)) * 20 : valor.posicao.y;
		const alturaInvertida = posicaoInvertida(segundoEstado)(altura);

		const nuvens = [assets[5], assets[6], assets[7]];
		const nuvensInvertidas = [assets[16], assets[17], assets[18]];

		const tipo = valor.tipo - 1 === -1 ? 0 : valor.tipo - 1;

		utilidades.desenharObstaculo(ctx)(estado.corAtual)(estado.modificacoes.invertido ? nuvensInvertidas[tipo] : nuvens[tipo])({ x: 25, y: 25 })({ ...valor.posicao, y: segundoEstado.modificacoes.invertido ? alturaInvertida + 50 : altura })(estado.modificacoes.invertido);
		return { tipo: valor.tipo === 0 ? Math.floor(Math.random() * nuvens.length) + 1 : valor.tipo, posicao: { x: (valor.posicao.x - 2) - estado.fpsVelocidade * (altura / 100), y: altura } };
	});

	const atualizarSprite = segundoEstado.spriteAtual >= 75 ? 0 : segundoEstado.spriteAtual + 1;

	const estadoFinal = {
		...segundoEstado,
		posicaoObstaculos: novaPosicaoObstaculos,
		posicaoHabilidades: novaPosicaoHabilidades,
		posicaoJogador: andar(segundoEstado)(segundoEstado.fpsVelocidade)(segundoEstado.posicaoJogador)(tamanhoCanvas.x / 2),
		posicaoNuvens: novaPosicaoNuvens,
		spriteAtual: atualizarSprite,
		spriteJogador: atualizarSprite % 25 === 0 ? (segundoEstado.spriteJogador >= 2 ? 0 : segundoEstado.spriteJogador + 1) : segundoEstado.spriteJogador,
	};


	if (estadoFinal.checarModificacoes(estadoFinal)) {
		/* 	Imprimir timer de habilidade */
		const { intangivel, invertido, vidaExtra, setasDesbloqueadas } = estadoFinal.modificacoes;
		const imprimir = (texto) => utilidades.criarTexto(ctx)(16)(estadoFinal.corAtual)(texto)('right')({ x: tamanhoCanvas.x * window.devicePixelRatio, y: 30 });
		if (vidaExtra) imprimir('VIDA EXTRA')
		if (intangivel) imprimir(`INTANGIVEL ${habilidadeTimerNormalizado == '' ? '0' : habilidadeTimerNormalizado}`)
		if (invertido) imprimir(`INVERTIDO ${habilidadeTimerNormalizado == '' ? '0' : habilidadeTimerNormalizado}`)
		if (setasDesbloqueadas) imprimir(`SETAS LIVRES ${habilidadeTimerNormalizado == '' ? '0' : habilidadeTimerNormalizado}`)
	}

	/*	Jogador */
	pular(estadoFinal)({ y: alturaPulo })(alturaPulo)(estadoFinal.fpsVelocidade);
	const jogadorSprite = [assets[8], assets[9], assets[10]];
	const jogadorSpriteInvertido = [assets[11], assets[12], assets[13]];
	const alturaJogador = 4 + posicaoInvertida(estado)(estadoFinal.posicaoJogador.y) - tamanhoCanvas.y / 2 + estadoFinal.tamanhoJogador.y;
	const estaInvertido = estadoFinal.modificacoes.invertido;
	utilidades.desenharObstaculo(ctx)(estadoFinal.corAtual)((estadoFinal.modificacoes.invertido ? jogadorSpriteInvertido : jogadorSprite)[estadoFinal.spriteJogador])(estadoFinal.tamanhoJogador)(estaInvertido ? { ...estadoFinal.posicaoJogador, y: alturaJogador < 100 ? 101 : alturaJogador } : { ...estadoFinal.posicaoJogador, y: estadoFinal.posicaoJogador.y > 101 ? 99 : estadoFinal.posicaoJogador.y })(estadoFinal.modificacoes.invertido);

	/* 	Aqui é definido o chão */
	utilidades.desenharLinha(ctx)(estadoFinal.corAtual)(0)(tamanhoCanvas.x * window.devicePixelRatio)(tamanhoCanvas.y / 2)(tamanhoCanvas.y / 2)
	/* 	Imprimir texto de pontuação */
	utilidades.criarTexto(ctx)(16)(estadoFinal.corAtual)(`MELHOR ${maiorPontuacaoNormalizada ? maiorPontuacaoNormalizada : 0} | PONTUAÇÃO ${pontuacaoNormalizada}`)('right')({ x: tamanhoCanvas.x * window.devicePixelRatio, y: 10 })
	return estadoFinal;
};

// ─── Eventos ─────────────────────────────────────────────────────────────────

/*	Aqui são definidas as funções dos eventos */
const definirEventos = (evento) => {
	switch (evento) {
		case 'resize': return () => estado_.faseAtual == 1 ? document.location.reload() : false;
		case 'blur': return () => estado_.faseAtual == 1 ? audioAmbiente.pause() : false;
		case 'focus': return () => estado_.faseAtual == 1 ? audioAmbiente.play() : false;
		case 'keydown': return (e) => {
			const apertouEspaco = e.code === 'Space';
			const apertouDescer = e.code === 'KeyS' || e.code === 'ArrowDown';
			const estaPulando = estado_.animacao || estado_.pulando;

			if (!apertouEspaco && !apertouDescer && estaPulando) return false;

			/* 	Infelizmente, até o momento não encontramos uma forma de gerenciar
				estados sem quebrar o paradigma funcional */
			if (apertouEspaco && !estaPulando && estado_.faseAtual == 1) {
				estado_.pulando = true;
				audioPular.pause();
				audioPular.reiniciar();
				audioPular.play();
			}

			if (apertouEspaco && !estaPulando && estado_.faseAtual == 0) {
				document.getElementById('comecarAJogar').style.visibility = 'hidden';
				estado_.faseAtual = 1;
				audioAmbiente.criarLoop();
				audioAmbiente.play();
			}

			if (apertouDescer && estaPulando) {
				estado_.descendo = true;
			}

			return true;
		}

		default: return () => false;
	}
}

/* 	Evento acionado quando uma tecla é pressionada Dentro, podemos gerenciar
	ações como a de pular, ou iniciar a partida */
window.addEventListener('keydown', definirEventos('keydown'), false);
/*  Evento acionado quando a janela é redimensionada. Quando alterado o tamanho
	da página, o cenário deve ser recarregado para evitar erros */
window.addEventListener('resize', definirEventos('resize'), false);
/*	Evento de quando a página é desfocada, útil para pausar a música */
window.addEventListener('blur', definirEventos('blur'), false);
/*	Evento quando o foco volta à página */
window.addEventListener('focus', definirEventos('focus'), false);

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

	if (!localStorage['maiorPontuacao']) localStorage['maiorPontuacao'] = 0;

	/* 	Se o jogador perder, a página é reiniciada */
	if (estadoInicial.perdeu) {
		if (estadoInicial.modificacoes.vidaExtra) {
			assets.audio.audioExplosao.play();
			estadoInicial.posicaoObstaculos = [];
			estadoInicial.modificacoes.vidaExtra = false;
			estadoInicial.perdeu = false;
		}
		else {
			assets.audio.audioAmbiente.pause();
			assets.audio.perdeuAudio.play();
			estadoInicial.pausado = true;
			localStorage['maiorPontuacao'] = estadoInicial.pontuacaoAtual > JSON.parse(localStorage['maiorPontuacao']) ? estadoInicial.pontuacaoAtual : localStorage['maiorPontuacao'];
			setTimeout(() => document.location.reload(), 1000);
		}
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
	const loadImage = (img) => new Promise((res, rej) => Object.assign((img), { onload(e) { res(this) }, onerror: rej }));

	/*	O jogo só deve ser iniciado após todas as imagens estejam carregadas */
	const assetsImagens = await Promise.all(imagens.map(loadImage));

	const loop = loopJogo(estado_)(tempoAtual)({ imagem: assetsImagens, audio: audios });
	const menu = () => criarMenu(ctx)(assetsImagens[0])(utilidades);
	const fase = criarFase(ctx)(utilidades)(imagens);

	return window.requestAnimationFrame(loop(menu)(fase));
})(imagens)({ perdeuAudio, audioPular, audioAmbiente, audioExplosao })();
