// Criação do jogador
const Jogador = {};
Jogador.posicao = { x: 0, y: window.innerHeight / 2 + 25 };
Jogador.estaPulando = false;
Jogador.estaEmAnimacao = false;

Jogador.pular = (altura) => {
    if (Jogador.estaPulando && Jogador.posicao.y >= window.innerHeight / 2 - altura) {
        Jogador.estaEmAnimacao = true;
        Jogador.posicao = Cenario.moverCoordenadas({ x: 0, y: -4 })(Jogador.posicao);
    }
    if (Jogador.posicao.y < window.innerHeight / 2 + 25) {
        if (Jogador.posicao.y <= window.innerHeight / 2 - altura) setTimeout(() => Jogador.estaPulando = false, 100);
        if (!Jogador.estaPulando) {
            Jogador.posicao = Cenario.moverCoordenadas({ x: 0, y: 5 * window.innerHeight / 1000 })(Jogador.posicao);
        };
    }
    Jogador.posicao.y >= window.innerHeight / 2 + 25 ? Jogador.estaEmAnimacao = false : null;
}

Jogador.desenhar = (ctx) => (posicao) => (tamanho) => {
    ctx.fillStyle = "blue";
    ctx.fillRect(posicao.x, posicao.y, tamanho.x, tamanho.y);
}