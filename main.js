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

        // Contador de tempo e deslocamento vertical da pipa
        this.time = 0;
        this.translateY = 0;

        //Aqui envia os shaders em WGSL pra GPU
        this.program = gpu.createProgram(vertShaderSrc, fragShaderSrc, {
            cullMode: 'none',
        });

        // Cria os 4 triângulos (12 vértices no total)
        const [positions, colors] = this.createKiteScene();
        this.shape = gpu.createShape([positions.slice(0, 24), colors.slice(0, 24)], 6);
        this.firstTailShape = gpu.createShape([positions.slice(24, 36), colors.slice(24, 36)], 3);
        this.secondTailShape = gpu.createShape([positions.slice(36, 48), colors.slice(36, 48)], 3);

        // Cada parte tem seu buffer para receber uma matriz diferente
        this.uniform = gpu.createUniform(this.program, createIdentityMat4());
        this.firstTailUniform = gpu.createUniform(this.program, createIdentityMat4());
        this.secondTailUniform = gpu.createUniform(this.program, createIdentityMat4());
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

            // Primeiro Lacinho Laranja, com o ponto de ligação na origem local
            0.00, 0.00, 0.0, 1.0,
            0.02, -0.20, 0.0, 1.0,
            0.14, -0.12, 0.0, 1.0,

            // Segundo Lacinho Laranja, também em coordenadas locais
            0.00, 0.00, 0.0, 1.0,
            0.02, -0.19, 0.0, 1.0,
            0.14, -0.10, 0.0, 1.0,
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
        this.translateY = amplitude * Math.sin(this.time);

        // Rotação leve em torno do centro vertical do corpo da pipa
        const angle = 0.14 * Math.sin(this.time * 0.8);
        const centerY = (0.55 - 0.20) / 2;
        const translation = createTranslationMat4(0, this.translateY, 0);
        const toCenter = createTranslationMat4(0, centerY, 0);
        const rotation = createRotationZMat4(angle);
        const fromCenter = createTranslationMat4(0, -centerY, 0);

        const localRotation = multiplyMat4(toCenter, multiplyMat4(rotation, fromCenter));
        return multiplyMat4(translation, localRotation);
    }

    createFirstTailModelMatrix(model) {
        // A primeira fita herda o movimento da pipa e gira na ponta inferior
        const angle = 0.20 * Math.sin(this.time * 1.6);
        const translation = createTranslationMat4(0, -0.20, 0);
        const rotation = createRotationZMat4(angle);

        const localModel = multiplyMat4(translation, rotation);
        return multiplyMat4(model, localModel);
    }

    createSecondTailModelMatrix(firstTailModel) {
        // A segunda fita herda a primeira e oscila com uma diferença de fase
        const angle = 0.28 * Math.sin(this.time * 1.6 - 0.5);
        const translation = createTranslationMat4(0.02, -0.20, 0);
        const rotation = createRotationZMat4(angle);

        const localModel = multiplyMat4(translation, rotation);
        return multiplyMat4(firstTailModel, localModel);
    }

    createViewMatrix() {
        // Acompanhamento vertical parcial da pipa (fator de 50%):
        // A câmera se desloca no mesmo sentido da pipa, mas com metade do "alcance",
        // garantindo a percepção de movimento vertical na tela.
        const trackingFactor = 0.5;
        const cameraY = (this.translateY ?? 0) * trackingFactor;

        // Desloca tanto a posição do observador (eye) quanto o alvo (at) no eixo Y
        const eye = [0, cameraY, 2];
        const at = [0, cameraY, 0];
        const up = [0, 1, 0];

        return createLookAtMat4(eye, at, up, true);
    }

    createProjectionMatrix() {
        // Projeção ortográfica para o volume canônico do WebGPU.
        // As dimensões horizontais são multiplicadas pelo aspect ratio para evitar distorção.
        const aspect = 1024 / 768;
        return createOrthographicMat4(-1.6 * aspect, 1.6 * aspect, -1.6, 1.6, 0.1, 10);
    }

    drawShape(gpu, shape, uniform, model, view, projection) {
        // Multiplicação P * V * M
        const modelView = multiplyMat4(view, model);

        //Essa matriz uniform que aglomera todas as transformações aplicadas nos vértices, ela que é enviada pra GPU
        const uniformMatriz = multiplyMat4(projection, modelView);

        uniform.data.set(uniformMatriz);
        gpu.writeBuffer(uniform.buffer, uniform.data);
        gpu.draw(this.program, shape, [uniform.bindGroup]);
    }

    draw(gpu) {

        //Monta 1 frame, usando o mesmo tempo para a pipa e as duas fitas
        const model = this.createModelMatrix();
        const firstTailModel = this.createFirstTailModelMatrix(model);
        const secondTailModel = this.createSecondTailModelMatrix(firstTailModel);
        const view = this.createViewMatrix();
        const projection = this.createProjectionMatrix();

        this.drawShape(gpu, this.shape, this.uniform, model, view, projection);
        this.drawShape(gpu, this.firstTailShape, this.firstTailUniform, firstTailModel, view, projection);
        this.drawShape(gpu, this.secondTailShape, this.secondTailUniform, secondTailModel, view, projection);
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
