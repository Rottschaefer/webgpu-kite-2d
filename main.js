import vertShaderSrc from './projection.vert.js';
import fragShaderSrc from './projection.frag.js';
import WebGPU from './lib/webgpu.js';
import {
    createIdentityMat4,
    createLookAtMat4,
    createOrthographicMat4,
    createPerspectiveMat4,
    createRotationXMat4,
    createRotationYMat4,
    createRotationZMat4,
    createScaleMat4,
    createTranslationMat4,
    multiplyMat4,
} from './lib/utils.js';

class Scene {
    constructor(gpu) {

        // Contador de tempo para fazer a animação
        this.time = 0;

        //Aqui envia os shaders em WGSL pra GPU
        this.program = gpu.createProgram(vertShaderSrc, fragShaderSrc, {
            cullMode: 'none',
        });

        // Cria os 4 triângulos (12 vértices no total)
        this.shape = gpu.createShape(this.createKiteScene(), 12);

        // Reserva buffer na GPU
        this.uniform = gpu.createUniform(this.program, createIdentityMat4());
    }

    createKiteScene() {

        // Criação dos triângulos que compõe a pipa e suas cores
        const positions = [
            //Metade Esquerda Vermelha
            0.0, 0.55, 0.0, 1.0,
            -0.28, 0.25, 0.0, 1.0,
            0.0, -0.20, 0.0, 1.0,

            //Metade Direita Amarela
            0.0, 0.55, 0.0, 1.0,
            0.0, -0.20, 0.0, 1.0,
            0.28, 0.25, 0.0, 1.0,

            // Primeiro Lacinho Laranja
            0.00, -0.22, 0.0, 1.0,
            0.02, -0.42, 0.0, 1.0,
            0.14, -0.34, 0.0, 1.0,

            // Segunfo Lacinho Laranja
            0.09, -0.43, 0.0, 1.0,
            0.11, -0.62, 0.0, 1.0,
            0.23, -0.53, 0.0, 1.0,
        ];

        // Define as cores
        const redKite = [0.89, 0.12, 0.12, 1.0];
        const yellowKite = [0.99, 0.80, 0.08, 1.0];
        const orangeTail = [0.98, 0.46, 0.08, 1.0];

        const colors = [
            ...redKite, ...redKite, ...redKite,       // Triângulo 1 (Pipa Esquerda)
            ...yellowKite, ...yellowKite, ...yellowKite,    // Triângulo 2 (Pipa Direita)
            ...orangeTail, ...orangeTail, ...orangeTail,    // Triângulo 3 (Fita 1)
            ...orangeTail, ...orangeTail, ...orangeTail,    // Triângulo 4 (Fita 2)
        ];

        return [positions, colors];
    }

    createModelMatrix() {
        // Avança o tempo do loop a cada frame
        this.time += 0.03;

        // Movimento vertical contínuo (subir e descer) usando seno
        const amplitude = 0.35;
        const translateY = amplitude * Math.sin(this.time);

        return createTranslationMat4(0, translateY, 0);
    }

    createViewMatrix() {
        // Câmera 2D ortogonal posicionada em Z = 2, olhando para a origem (0, 0, 0)
        const eye = [0, 0, 2];
        const at = [0, 0, 0];
        const up = [0, 1, 0];

        return createLookAtMat4(eye, at, up, true);
    }

    createProjectionMatrix() {
        const aspect = 1024 / 768;
        return createOrthographicMat4(-1.6 * aspect, 1.6 * aspect, -1.6, 1.6, 0.1, 10);
    }

    draw(gpu) {

        //Monta 1 frame

        const model = this.createModelMatrix();
        const view = this.createViewMatrix();
        const projection = this.createProjectionMatrix();

        // Multiplicação P * V * M
        const modelView = multiplyMat4(view, model);

        //Essa matriz uniform que aglomera todas as transformações aplicadas nos vértices, ela que é enviada pra GPU
        const uniformMatriz = multiplyMat4(projection, modelView);

        this.uniform.data.set(uniformMatriz);
        gpu.writeBuffer(this.uniform.buffer, this.uniform.data);
        gpu.draw(this.program, this.shape, [this.uniform.bindGroup]);
    }
}

class Main {
    async init() {

        // Cria background em azul claro que é a cor do céu
        this.gpu = await WebGPU.createCanvas('#glcanvas', 1024, 768, {
            clearColor: { r: 0.58, g: 0.79, b: 0.98, a: 1.0 },
            depth: false,
        });
        this.scene = new Scene(this.gpu);
    }

    draw() {
        this.gpu.start();
        this.scene.draw(this.gpu);
        this.gpu.finish();

        //Assim que termina a exibição do frame atual, chamamos requestAnimationFrame() para calcular o pŕoximo e ir montando a animação
        requestAnimationFrame(this.draw.bind(this));
    }
}

try {
    const app = new Main();
    await app.init();
    app.draw();
} catch (error) {
    console.error(error);
    document.body.insertAdjacentHTML('beforeend', `<p>${error.message}</p>`);
}
