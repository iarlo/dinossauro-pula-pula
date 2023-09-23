// Criação do estado
const Estado = {};
Estado.faseAtual = 0;
Estado.pontuacao = 0;
Estado.melhorPontuacao = 0;
Estado.jogadorPulando = false;
Estado.jogadorPerdeu = false;
Estado.obstaculos = []; // Lista de obstáculos
Estado.semente = () => Math.random(); // Será usado para gerar aleatoriamente a distância entre obstáculos
