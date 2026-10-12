
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

