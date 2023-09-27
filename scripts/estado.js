// Criação do estado
const Estado = {};
Estado.faseAtual = -1;
Estado.pontuacao = 0;
Estado.melhorPontuacao = 0;
Estado.jogadorPulando = false;
Estado.jogadorPerdeu = false;
Estado.obstaculos = []; // Lista de obstáculos
Estado.habilidades = []; // Lista de habilidades
Estado.limparObstaculos = () => Estado.obstaculos = [];
Estado.semente = () => Math.random(); // Será usado para gerar aleatoriamente a distância entre obstáculos
Estado.velocidadeInicial = window.innerWidth / 500