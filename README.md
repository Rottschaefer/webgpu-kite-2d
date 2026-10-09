#Descricao trabalho

Implemente, em WebGPU, uma cena 2D animada de uma pipa voando sobre um fundo que represente o céu usando uma cor sólida. Use como base os códigos produzidos em sala e disponíveis em https://github.com/mlage/curso-cg

Composição da cena

A cena deve usar somente quatro triângulos (veja imagem em anexo):

- dois triângulos, em cores distintas, para compor a pipa;
- dois triângulos para compor as fitas da cauda.

Não utilize texturas, imagens externas, bibliotecas de renderização ou primitivas diferentes de triângulos.

Animação e transformações

- A pipa deve subir e descer continuamente, fazendo uma leve rotação.
- As fitas da cauda devem se movimentar de forma diferente, mas coerente, em relação ao movimento da pipa.
- A câmera deve acompanhar parcialmente o movimento vertical, sem eliminar a percepção de movimento da pipa na tela.
- A projeção deve ser ortográfica.

Utilize matrizes de modelagem, câmera e projeção. A aplicação deve usar WebGPU, shaders WGSL, buffers de vértices, uniform buffers e animação contínua por `requestAnimationFrame`.

Entregáveis

- Código-fonte completo desenvolvido usando os códigos produzidos em sala como base. 
- Relatório explicando a implementação, incluindo a modelagem da cena, transformações, câmera, projeção e animação.

Critérios de avaliação

1. Modelagem da pipa:  1,5 pontos
2. Movimento vertical da pipa: 1,5  pontos
3. Movimento de rotação da pipa: 1,5 pontos
4. Movimento da cauda da pipa: 1,5 pontos
5. Implementação da câmera: 1,5 pontos 
6. Implementação da projeção ortogonal: 1,5 pontos
6. Relatório: 1,0 ponto
