// Criação do estado
const Estado = {};
Estado.faseAtual = -1;
Estado.pontuacao = 0;
Estado.melhorPontuacao = 0;
Estado.pausado = false;
Estado.jogadorPulando = false;
Estado.jogadorPerdeu = false;
Estado.obstaculos = []; // Lista de obstáculos
Estado.habilidades = []; // Lista de habilidades
Estado.limparObstaculos = () => Estado.obstaculos = [];
Estado.semente = () => Math.random() + 1; // Será usado para gerar aleatoriamente a distância entre obstáculos
// Estado.velocidadeInicial = window.innerWidth / 500;

Estado.velocidadeInicial = 3.84;
Estado.velocidade = 1;

Estado.alturaPulo = 125;
Estado.altura = Estado.alturaPulo + 1;
Estado.tamanhoInicialObstaculos = { x: 25, y: 50 };
Estado.tamanhoInicialHabilidades = { x: 25, y: 25 };
