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

## Critérios de avaliação

1. Modelagem da pipa: 1,5 pontos
2. Movimento vertical da pipa: 1,5 pontos
3. Movimento de rotação da pipa: 1,5 pontos
4. Movimento da cauda da pipa: 1,5 pontos
5. Implementação da câmera: 1,5 pontos 
6. Implementação da projeção ortogonal: 1,5 pontos
7. Relatório: 1,0 ponto

---

## 🚀 Como Executar o Projeto

### 1. Iniciar um Servidor Local
Como a aplicação utiliza módulos ES6 (`import`/`export`) e WebGPU, ela precisa ser servida por um servidor HTTP local:

- **Via VS Code (Recomendado):**
  - Instale a extensão [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer).
  - Clique com o botão direito em `main.html` e selecione **"Open with Live Server"** (ou use o botão **"Go Live"** no rodapé).

- **Via Terminal:**
  ```bash
  # Opção com Python:
  python3 -m http.server 8080
  # Acesse: http://localhost:8080/main.html

  # Ou com Node.js:
  npx live-server --entry-file=main.html
  ```

---

### ⚠️ Configuração Obrigatória para Linux (Google Chrome / Chromium)

No Linux, a maioria dos navegadores baseados em Chromium mantém o backend WebGPU (Vulkan) desativado por padrão devido a políticas de drivers. Se você abrir o projeto no Linux sem essas flags, receberá o erro: `Could not get a WebGPU adapter`.

Para rodar no Linux com sucesso, siga um dos métodos abaixo:

#### Método A: Configurar via `chrome://flags` (Recomendado)
1. No Google Chrome, acesse:
   ```text
   chrome://flags/#enable-unsafe-webgpu
   ```
2. Mude a flag **"Unsafe WebGPU"** para **`Enabled`**.
3. *(Opcional/Recomendado)* Acesse `chrome://flags/#enable-vulkan` e mude para **`Enabled`**.
4. Clique no botão azul **Relaunch** (Reiniciar) que surgirá no rodapé da janela.
5. Acesse `http://127.0.0.1:5500/main.html` (ou a porta correspondente do seu servidor).

#### Método B: Iniciar o Chrome direto pelo Terminal com a Flag
Basta abrir o Chrome passando a flag de ativação:
```bash
google-chrome --enable-unsafe-webgpu http://127.0.0.1:5500/main.html
```

> **Nota sobre o Firefox no Linux:** O suporte a WebGPU no Firefox para Linux ainda é altamente experimental e vem desabilitado no kernel do navegador. Para correção e avaliação do trabalho, utilize o **Google Chrome** ou **Chromium**.

