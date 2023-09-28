// Criação do jogador
const Jogador = {};
Jogador.tamanho = { x: 50, y: 50 };
Jogador.resetarYInicial = () => Estado.altura;
Jogador.yInicial = Estado.altura;
Jogador.posicao = { x: 50, y: Estado.altura };
Jogador.estaPulando = false;
Jogador.estaEmAnimacao = false;

Jogador.pular = (altura) => {
    if (Jogador.estaPulando && Jogador.posicao.y >= Jogador.yInicial - altura) {
        Jogador.estaEmAnimacao = true;
        Jogador.posicao = Cenario.moverCoordenadas({ x: 0, y: -5 * Estado.velocidade })(Jogador.posicao);
    }
    if (Jogador.posicao.y < Jogador.yInicial) {
        if (Jogador.posicao.y <= Jogador.yInicial - altura) setTimeout(() => Jogador.estaPulando = false, 150);
        if (!Jogador.estaPulando) Jogador.posicao = Cenario.moverCoordenadas({ x: 0, y: 4 * Estado.velocidade })(Jogador.posicao);
    }
    Jogador.posicao.y >= Jogador.yInicial ? Jogador.estaEmAnimacao = false : null;
}

Jogador.desenhar = (ctx) => (posicao) => (tamanho) => {
    ctx.fillStyle = "blue";
    ctx.fillRect(posicao.x, posicao.y, tamanho.x, tamanho.y);
}