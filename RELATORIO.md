# Relatório Técnico: Implementação de Cena 2D Animada de Pipa em WebGPU
 
**Base do Projeto:** Códigos produzidos em: ([repositório curso-cg](https://github.com/mlage/curso-cg)) 

**Integrantes e Divisão de Responsabilidades:**

* **Felipe Cabral Liporage - Frente 1 (Base + Movimento Vertical):** Configuração do pipeline WebGPU, modelagem dos vértices dos triângulos, ciclo de animação e translação vertical periódica.
* **Eduardo Rottschaefer Oliveira - Frente 2 (Rotação + Hierarquia da Cauda):** Rotação da pipa em torno do centro geométrico e modelagem hierárquica (grafo de cena) das fitas da cauda.
* **Allan Vignoli dos Santos - Frente 3 (Câmera + Projeção Ortogonal + Relatório Técnico):** Implementação da câmera com rastreamento vertical parcial, configuração de projeção ortogonal e elaboração da documentação técnica.

---

## 1. Visão Geral e Arquitetura do Sistema

A aplicação consiste em uma cena 2D interativa em tempo real desenvolvida com a API **WebGPU**, utilizando shaders em **WGSL** (*WebGPU Shading Language*) e a biblioteca auxiliar fornecida pelo próprio professor (`lib/webgpu.js` e `lib/utils.js`).

### 1.1 O que foi "tirado" do material base e adaptado?
A infraestrutura de baixo nível foi tirada do repositório da disciplina:

* **`lib/webgpu.js`:** Utilizado para solicitar o adaptador e dispositivo WebGPU, encapsular o contexto do canvas HTML5 (`GPUCanvas`), compilar shaders WGSL em render pipelines (`createProgram`), instanciar buffers de vértices (`createShape`) e alocar uniform buffers (`createUniform`).

* **`lib/utils.js`:** Fornece as operações matemáticas fundamentais com matrizes $4 \times 4$ em ordem *column-major* (formato nativo do WebGPU), incluindo identidade, translação, rotação, multiplicação, a função de câmera `createLookAtMat4` e a projeção `createOrthographicMat4`.

* **Pipeline de Shaders (`projection.vert.js` e `projection.frag.js`):** São versões adaptadas tiradas diretamente do módulo de projeções de sala de aula (`07 - projeções`). O vertex shader recebe coordenadas de vértices em `@location(0)` e cores por vértice em `@location(1)`, aplicando a transformação afim projetiva completa via Uniform Buffer:

  $$\mathbf{v}_{\text{clip}} = \mathbf{M}_{\text{MVP}} \cdot \mathbf{v}_{\text{local}}$$

  O fragment shader atua como interpolador linear das cores dos vértices para o fragmento.

* **Loop de Renderização:** Orquestrado na classe `Main` através de chamadas recursivas a `requestAnimationFrame(this.draw.bind(this))`, garantindo sincronização com a taxa de atualização do monitor.

---

## 2. Modelagem da Pipa (Critério 1 — 1,5 pontos)

**Localização no código:** `Scene.createKiteScene()` e `Scene.constructor` em [main.js](main.js).

### Requisito
Utilizar estritamente quatro triângulos na cena: dois em cores distintas para o corpo da pipa e dois para as fitas da cauda, sobre um fundo azul sólido representando o céu, sem o uso de texturas ou bibliotecas externas de renderização.

### Implementação e Decisões de Projeto
A cena foi decomposta em exatamente 12 vértices (4 primitivas do tipo `triangle-list`):

1. **Corpo da Pipa (2 Triângulos):**

   * **Metade Esquerda (Vermelha - `rgb(0.89, 0.12, 0.12)`):** Triângulo definido pelos vértices $[(0.0, 0.55), (-0.28, 0.25), (0.0, -0.20)]$.

   * **Metade Direita (Amarela - `rgb(0.99, 0.80, 0.08)`):** Triângulo definido pelos vértices $[(0.0, 0.55), (0.0, -0.20), (0.28, 0.25)]$.

   * A junção forma um losango com ápice superior em $y = 0.55$, extremidade inferior em $y = -0.20$ e envergadura lateral de $x = \pm 0.28$.

2. **Fitas da Cauda (2 Triângulos):**

   * **Fita 1 (Laranja - `rgb(0.98, 0.46, 0.08)`):** Vértices $[(0.00, 0.00), (0.02, -0.20), (0.14, -0.12)]$.

   * **Fita 2 (Laranja - `rgb(0.98, 0.46, 0.08)`):** Vértices $[(0.00, 0.00), (0.02, -0.19), (0.14, -0.10)]$.

   * Ambas foram modeladas tendo sua ponta de conexão posicionada na origem local $(0, 0)$, o que permite que rotações locais girem exatamente sobre a junta de fixação.

3. **Céu de Cor Sólida:**
   * Definido na criação do canvas através da opção de cor de limpeza do WebGPU (azul claro):
     `clearColor: { r: 0.58, g: 0.79, b: 0.98, a: 1.0 }`.

4. **Gerenciamento de Buffers:**
   * Para viabilizar transformações geométricas independentes e hierárquicas, os vértices foram alocados em três objetos de forma (`GPUBuffer`) distintos: `this.shape` (corpo, 6 vértices), `this.firstTailShape` (fita 1, 3 vértices) e `this.secondTailShape` (fita 2, 3 vértices), cada um associado ao seu próprio uniform buffer.

---

## 3. Movimento Vertical da Pipa (Critério 2 — 1,5 pontos)

**Localização no código:** `Scene.createModelMatrix()` em [main.js](main.js).

### Requisito
A pipa deve subir e descer continuamente pela tela de maneira suave.

### Fundamentação Matemática e Implementação
Para produzir uma oscilação contínua e suave, foi adotada a função harmônica seno:
$$y(t) = A \cdot \sin(\omega t)$$

* O contador de tempo `this.time` é incrementado em $\Delta t = 0.03$ a cada frame de renderização.
* Foi definida uma amplitude $A = 0.35$, gerando um percurso de subida e descida no intervalo $[-0.35, +0.35]$.
* Esse valor é convertido em uma matriz de translação afim $4 \times 4$ através da função `createTranslationMat4(0, this.translateY, 0)`.
* Essa abordagem herda o modelo de translação afim estudado em `05 - transformacoes`, operando diretamente no eixo Y global.

---

## 4. Movimento de Rotação da Pipa (Critério 3 — 1,5 pontos)

**Localização no código:** `Scene.createModelMatrix()` em [main.js](main.js).

### Requisito
A pipa deve realizar uma leve rotação periódica durante o voo.

### Fundamentação Matemática e Pivô de Rotação
Em computação gráfica, matrizes de rotação padrão operam em torno da origem $(0, 0, 0)$. Caso uma rotação pura fosse aplicada à pipa, ela giraria ao redor da ponta inferior ou do meio do eixo cartesiano, gerando uma trajetória excêntrica e artificial.

Para que a pipa oscile em torno do seu próprio centro de gravidade/massa geométrico:
1. Calculou-se o centro vertical do losango:
   $$y_{\text{centro}} = \frac{0.55 + (-0.20)}{2} = 0.175$$

2. O ângulo de inclinação foi modelado como uma função senoidal defasada em frequência:
   $$\theta(t) = 0.14 \cdot \sin(0.8 \cdot t) \quad (\approx \pm 8^\circ)$$

3. Aplicou-se a clássica decomposição de rotação em torno de um pivô arbitrário:
   $$\mathbf{M}_{\text{rot\_local}} = \mathbf{T}(0, y_{\text{centro}}, 0) \cdot \mathbf{R}_z(\theta(t)) \cdot \mathbf{T}(0, -y_{\text{centro}}, 0)$$

4. Por fim, a matriz final de modelagem do corpo da pipa combina a translação vertical com a rotação centralizada:
   $$\mathbf{M}_{\text{pipa}} = \mathbf{T}_{\text{vertical}} \cdot \mathbf{M}_{\text{rot\_local}}$$

Essa técnica herda o que foi desenvolvido no módulo `05 - transformacoes` do repositório da disciplina.

---

## 5. Movimento da Cauda da Pipa (Critério 4 — 1,5 pontos)

**Localização no código:** `Scene.createFirstTailModelMatrix()` e `Scene.createSecondTailModelMatrix()` em [main.js](main.js).

### Requisito
As fitas da cauda devem se movimentar de forma diferente, porém coerente e subordinada à movimentação da pipa.

### Modelagem Hierárquica (Grafo de Cena)
Para simular a dinâmica física de uma fita maleável sob a ação do vento, utilizou-se o conceito de transformações hierárquicas(cadeia cinemática direta):

```
       [ Pipa (M_pipa) ]
              |
              v
     [ Fita 1 (M_fita1) ]  = M_pipa * M_local1
              |
              v
     [ Fita 2 (M_fita2) ]  = M_fita1 * M_local2
```

1. **Primeira Fita:**
   * Ponto de ancoragem: ponta inferior do corpo da pipa em $(0, -0.20, 0)$.
   * Oscilação angular: $\theta_1(t) = 0.20 \cdot \sin(1.6 \cdot t)$. Note que a frequência angular ($1.6$) é o dobro da rotação da pipa ($0.8$), simulando a agitação mais rápida típica de fitas leves.

   * Matriz resultante:
     $$\mathbf{M}_{\text{fita1}} = \mathbf{M}_{\text{pipa}} \cdot (\mathbf{T}(0, -0.20, 0) \cdot \mathbf{R}_z(\theta_1(t)))$$

2. **Segunda Fita:**
   * Ponto de ancoragem: extremidade inferior da primeira fita em $(0.02, -0.20, 0)$ no seu espaço de coordenadas local.
   * Oscilação angular: $\theta_2(t) = 0.28 \cdot \sin(1.6 \cdot t - 0.5)$. A amplitude é maior e há uma defasagem de fase de $-0.5\text{ rad}$, criando o efeito de propagação de onda (chicoteamento da cauda).

   * Matriz resultante:
     $$\mathbf{M}_{\text{fita2}} = \mathbf{M}_{\text{fita1}} \cdot (\mathbf{T}(0.02, -0.20, 0) \cdot \mathbf{R}_z(\theta_2(t)))$$

Dessa forma, qualquer translação ou rotação sofrida pela pipa é herdada de forma cumulativa pelas duas fitas, enquanto cada fita adiciona seu próprio grau de liberdade angular.

---

## 6. Implementação da Câmera (Critério 5 — 1,5 pontos)

**Localização no código:** `Scene.createViewMatrix()` em [main.js](main.js).

### Requisito
A câmera deve acompanhar parcialmente o movimento vertical da pipa, sem eliminar a percepção de movimento da pipa na tela.

### Referência e Adaptação dos Códigos de Aula (`06 - camera`)
No exemplo prático do repositório da própria disciplina (`06 - camera/main.js`), é usado o deslocamento vertical da câmera através da função `createLookAtMat4`, variando conjuntamente a coordenada $Y$ da posição do observador (`eye`) e do alvo observado (`at`):
```javascript
const eye = [0, this.cameraPos, 0.0];
const at = [0, this.cameraPos, 0.5];
const up = [0, 1, 0];
return createLookAtMat4(eye, at, up);
```

### O Desafio do Acompanhamento Parcial
Em uma cena com fundo sólido (sem elementos de paralaxe como nuvens ou solo), se a câmera seguisse a pipa a $100\%$ da sua velocidade ($y_{\text{cam}} = y_{\text{pipa}}$):
$$y_{\text{tela}} = y_{\text{pipa}} - y_{\text{cam}} = 0$$
A pipa pareceria completamente congelada verticalmente no meio da tela, o que eliminaria a percepção de movimento. Por outro lado, manter a câmera imóvel ($y_{\text{cam}} = 0$) não atenderia ao acompanhamento.

### Solução Matemática Implementada
Adotou-se um fator de amortecimento (totalmente arbitrário, pode ser mudado facilmente) de $50\%$ ($k = 0.5$):
$$y_{\text{cam}}(t) = 0.5 \cdot y_{\text{pipa}}(t)$$

No espaço de visão projetado na tela, o deslocamento resultante observado é:
$$y_{\text{tela}}(t) = y_{\text{pipa}}(t) - y_{\text{cam}}(t) = 0.5 \cdot y_{\text{pipa}}(t)$$

Configuração dos vetores da câmera sintética:
* **`eye` (posição da câmera):** $[0, y_{\text{cam}}, 2.0]$ — posicionada à frente da cena no eixo Z.

* **`at` (ponto focal):** $[0, y_{\text{cam}}, 0.0]$ — mira o plano da pipa na mesma altura, realizando um movimento de translação vertical puro (*pedestal/pan vertical*) sem alterar a inclinação.

* **`up` (vetor para cima):** $[0, 1, 0]$.

* **Convenção de mão direita:** O quarto argumento `true` foi passado para `createLookAtMat4(eye, at, up, true)`, para seguir nos padrões do repositório da matéria.

Com tudo isso, a câmera sobe e desce ativamente no espaço de mundo seguindo a pipa, enquanto o viewer continua percebendo a oscilação vertical da pipa na tela.

---

## 7. Implementação da Projeção Ortogonal (Critério 6 — 1,5 pontos)

**Localização no código:** `Scene.createProjectionMatrix()` em [main.js](main.js).

### Requisito
A projeção deve ser ortográfica, integrando-se adequadamente às matrizes de câmera e modelagem.

### Referência e Adaptação dos Códigos de Aula (`07 - projeções`)
Em `07 - projeções/main.js`, a matriz ortogonal foi configurada respeitando o *aspect ratio* para o volume canônico do WebGPU:
```javascript
const aspect = 1024 / 768;
return createOrthographicMat4(-1.5 * aspect, 1.5 * aspect, -1.5, 1.5, 0.1, 10);
```

### Detalhes Técnicos da Configuração Adotada
Na nossa cena, configuramos:
```javascript
createProjectionMatrix() {
    const aspect = 1024 / 768;
    return createOrthographicMat4(-1.6 * aspect, 1.6 * aspect, -1.6, 1.6, 0.1, 10);
}
```

1. **Correção de Proporção de Tela (*Aspect Ratio*):**

   * O canvas possui resolução fixa de $1024 \times 768$ pixels, resultando em:
     $$\text{aspect} = \frac{1024}{768} \approx 1.3333$$

   * Multiplicar os limites horizontais (`left` e `right`) por `aspect` garante que as unidades cartesianas em $X$ e $Y$ tenham o mesmo tamanho em pixels na tela, impedindo que o formato do losango da pipa sofra alguma distorção (alongamento ou achatamento).

2. **Volume de Enquadramento:**
   * Os limites verticais $[-1.6, +1.6]$ foram dimensionados para acomodar com uma certa margem o limite superior da pipa em seu ponto máximo de subida ($0.55 + 0.35 = +0.90$) e a ponta final da segunda fita no ponto mais baixo de descida ($\approx -0.95$), garantindo que todo o conjunto continue bem enquadrado sem cortes nas bordas.

3. **Mapeamento de Profundidade no WebGPU ($Z_{\text{NDC}} \in [0, 1]$):**

   * Ao contrário do OpenGL tradicional (que mapeia $Z$ em $[-1, 1]$), o WebGPU mapeia a profundidade no volume canônico normalizado $[0, 1]$.
   * A função `createOrthographicMat4` de `lib/utils.js` já implementa a formulação canônica do WebGPU:
     $$Z_{\text{clip}} = -\frac{1}{\text{far} - \text{near}} \cdot Z_{\text{view}} - \frac{\text{near}}{\text{far} - \text{near}}$$
   * Com a câmera em $Z = 2$ e os vértices em $Z = 0$, temos $Z_{\text{view}} = -2$. Com $\text{near} = 0.1$ e $\text{far} = 10$, temos $Z_{\text{clip}} \approx 0.192 \in [0, 1]$, perfeitamente contido no intervalo de corte.

---

## 8. Pipeline de Transformação e Síntese de Renderização

A cada frame do ciclo de animação, o método `Scene.drawShape()` calcula e envia para a GPU a composição completa de matrizes:

$$\mathbf{M}_{\text{MVP}} = \mathbf{P} \cdot (\mathbf{V} \cdot \mathbf{M})$$

Onde:
1. $\mathbf{M}$ (*Model Matrix*): Posiciona, rotaciona e articula hierarquicamente cada uma das 3 partes (corpo, fita 1 e fita 2) no espaço de mundo.

2. $\mathbf{V}$ (*View Matrix*): Converte as coordenadas do espaço de mundo para o espaço do observador, aplicando o rastreamento vertical parcial.

3. $\mathbf{P}$ (*Projection Matrix*): Mapeia o volume de visão ortográfico no espaço canônico de corte normalizado (*Normalized Device Coordinates* - NDC) do WebGPU.

A matriz resultante é gravada via `gpu.writeBuffer` no buffer uniform compartilhado com o shader WGSL, que a aplica sobre cada vetor homogêneo de vértice `output.position = uniforms.modelViewProjection * position`.

---

## 9. Conclusão

O projeto cumpre, de forma sólida, os requisitos:
* Utilizamos estritamente 4 triângulos, cores sólidas e WebGPU puro;
* Aplica os conceitos matemáticos de transformações afins $2D$ e articulação hierárquica na animação da pipa e na cauda;
* Incorpora uma câmera sintética dinâmica que realiza acompanhamento vertical parcial (taxa de "acompanhamento" = 0.5) coerente;
* Aplica projeção ortogonal balanceada com correção de *aspect ratio* e bem adequada ao volume canônico do WebGPU;
* Muita fidelidade à base teórica/técninca que foi dada tanto no repositório de exemplo quanto nas aulas em si.

