// Criação do cenário
const Cenario = {};
Cenario.tamanho = (ctx) => ({ x: ctx.canvas.clientWidth, y: ctx.canvas.clientHeight }); // Retorna o tamanho do canvas
Cenario.proporcao = (multiplicador) => (coordenadas) => ({ x: coordenadas.x * multiplicador, y: coordenadas.y * multiplicador }); // Redimensiona coordenadas
Cenario.moverCoordenadas = (coordenadas) => (posicaoAtual) => ({ x: posicaoAtual.x + coordenadas.x, y: posicaoAtual.y + coordenadas.y }); // Posição atual somada com a posição desejada
Cenario.criarImagem = (caminho) => (estilo) => {
    const imagem = new Image();
    imagem.src = caminho;
    imagem.style = { ...estilo };
    return imagem;
};
// Preparar a formatação para poder exibir o texto
Cenario.formatarTexto = (ctx) => (tamanho) => (align) => (cor) => {
    ctx.fillStyle = cor;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.font = `${tamanho}px arial`;
    return ctx;
};
Cenario.desenharObstaculo = (ctx) => (tamanho) => (posicao) => {
    ctx.fillStyle = "black";
    ctx.fillRect(posicao.x, posicao.y, tamanho.x, tamanho.y);
};
Cenario.criarObstaculo = (semente) => (index) => (diminuir) => ({ x: index * (semente + window.innerWidth / 100) - diminuir, y: window.innerHeight / 2 });