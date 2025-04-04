document.addEventListener('DOMContentLoaded', () => {
    const gameCanvas = document.getElementById('gameCanvas');
    const ctx = gameCanvas.getContext('2d');

    if (!ctx) {
        console.error("Error: No se pudo obtener el contexto 2D del canvas.");
        return;
    }

    // Configurar dimensiones del canvas
    gameCanvas.width = 500;  // Un poco más ancho para mayor espacio de juego
    gameCanvas.height = 700; // Más alto para permitir más obstáculos

    // Pre-cargar imágenes para estresores (carpeta: imagenes)
    const imgCarpeta = new Image();
    imgCarpeta.src = "imagenes/carpeta.png";
    const imgJefe = new Image();
    imgJefe.src = "imagenes/jefe.png";
    const imgAuto = new Image();
    imgAuto.src = "imagenes/auto.png";

    // Pre-cargar imágenes para relajantes (carpeta: relajantes)
    const imgDormir = new Image();
    imgDormir.src = "relajantes/dormir.png";
    const imgEjercicio = new Image();
    imgEjercicio.src = "relajantes/ejercicio.png";
    const imgDieta = new Image();
    imgDieta.src = "relajantes/dieta.png";

    // Pre-cargar imágenes para suplementos (carpeta: suplementos)
    const imgZpro = new Image();
    imgZpro.src = "suplementos/Z-pro.png";
    const imgVmax = new Image();
    imgVmax.src = "suplementos/V-max.png";
    const imgDultra = new Image();
    imgDultra.src = "suplementos/D-ultra.png";

    // Variables del jugador
    const playerWidth = 30;
    const playerHeight = 50;
    let playerX = gameCanvas.width / 2 - playerWidth / 2;
    let playerY = gameCanvas.height - playerHeight - 70;
    let basePlayerSpeed = 5;
    let playerSpeed = basePlayerSpeed;
    let rightPressed = false;
    let leftPressed = false;
    
    // Variables de estado del juego
    let energy = 100;           // Energía/estrés del jugador
    let score = 0;              // Puntuación
    let gameOver = false;       // Estado de juego
    let shieldActive = false;   // Estado del escudo (D-ultra)
    let speedBoostActive = false; // Estado del impulso de velocidad (V-max)
    let shieldTimeLeft = 0;     // Tiempo restante del escudo
    let speedTimeLeft = 0;      // Tiempo restante del impulso de velocidad
    
    // Configuración de la UI
    const barHeight = 20;
    const bottomUIHeight = 60;  // Área de UI en la parte inferior
    
    // Arreglos para diferentes tipos de objetos del juego
    let stressors = [];        // Objetos que causan estrés (obstáculos)
    let relaxers = [];         // Objetos que reducen estrés (beneficios)
    let supplements = [];      // Suplementos GenXbio (power-ups especiales)
    
    // Configuración de objetos
    const objectWidth = 40;
    const objectHeight = 40;
    const objectSpeed = 3;
    const objectSpawnRate = 50; // Control de frecuencia de generación
    let frameCount = 0;
    
    // Colores para los diferentes tipos de objetos
    const colors = {
        player: '#3366CC',
        stressor: '#FF4444',
        relaxer: '#44BB44',
        zpro: '#9933CC',
        vmax: '#FF9900',
        dultra: '#33CCFF',
        shield: 'rgba(51, 204, 255, 0.3)',
        speedTrail: 'rgba(255, 153, 0, 0.3)'
    };
    
    // Tipos de objetos
    const gameObjectTypes = {
        // Estresores
        WORK: { type: 'stressor', color: colors.stressor, value: -15, name: 'Trabajo' },
        BILL: { type: 'stressor', color: colors.stressor, value: -10, name: 'Factura' },
        BOSS: { type: 'stressor', color: colors.stressor, value: -20, name: 'Jefe' },
        
        // Relajantes (ahora 3)
        SLEEP: { type: 'relaxer', color: colors.relaxer, value: 10, name: 'Dormir' },
        EXERCISE: { type: 'relaxer', color: colors.relaxer, value: 15, name: 'Ejercicio' },
        DIETA: { type: 'relaxer', color: colors.relaxer, value: 20, name: 'Dieta' },
        
        // Suplementos
        ZPRO: { type: 'supplement', color: colors.zpro, name: 'Z-pro', effect: 'fullEnergy' },
        VMAX: { type: 'supplement', color: colors.vmax, name: 'V-max', effect: 'speedBoost' },
        DULTRA: { type: 'supplement', color: colors.dultra, name: 'D-ultra', effect: 'shield' }
    };

    // Controladores de teclado
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Right' || e.key === 'ArrowRight') {
            rightPressed = true;
        } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
            leftPressed = true;
        }
        
        // Reiniciar juego con la tecla R
        if (gameOver && (e.key === 'r' || e.key === 'R')) {
            resetGame();
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'Right' || e.key === 'ArrowRight') {
            rightPressed = false;
        } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
            leftPressed = false;
        }
    });

    // Reiniciar todos los valores del juego
    function resetGame() {
        playerX = gameCanvas.width / 2 - playerWidth / 2;
        playerY = gameCanvas.height - playerHeight - 70;
        playerSpeed = basePlayerSpeed;
        energy = 100;
        score = 0;
        gameOver = false;
        shieldActive = false;
        speedBoostActive = false;
        shieldTimeLeft = 0;
        speedTimeLeft = 0;
        stressors = [];
        relaxers = [];
        supplements = [];
        frameCount = 0;
    }

    // MODIFICACIÓN: Dibujar al jugador con apariencia de ilustración vectorial
    function drawPlayer() {
        // Calcular el centro del jugador basado en su posición y dimensiones
        const bodyCenterX = playerX + playerWidth / 2;
        const bodyCenterY = playerY + playerHeight / 2;
        
        // Dibujar "sombra" de velocidad si está activa (como un halo circular)
        if (speedBoostActive) {
            ctx.fillStyle = colors.speedTrail;
            ctx.beginPath();
            ctx.arc(bodyCenterX, bodyCenterY, 35, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Dibujar el cuerpo (círculo grande)
        ctx.beginPath();
        ctx.arc(bodyCenterX, bodyCenterY, 20, 0, Math.PI * 2);
        ctx.fillStyle = "#3498db";
        ctx.fill();
        ctx.stroke();
        
        // Dibujar la cabeza (círculo más pequeño) posicionada arriba para indicar orientación al norte
        const headCenterX = bodyCenterX;
        const headCenterY = bodyCenterY - 20;
        ctx.beginPath();
        ctx.arc(headCenterX, headCenterY, 10, 0, Math.PI * 2);
        ctx.fillStyle = "#f8d5b8";
        ctx.fill();
        ctx.stroke();
        
        // Dibujar el indicador de dirección (flecha)
        ctx.beginPath();
        ctx.moveTo(headCenterX, headCenterY - 20);
        ctx.lineTo(headCenterX - 10, headCenterY - 5);
        ctx.lineTo(headCenterX + 10, headCenterY - 5);
        ctx.closePath();
        ctx.fillStyle = "red";
        ctx.fill();
        ctx.stroke();
        
        // Dibujar escudo si está activo
        if (shieldActive) {
            ctx.strokeStyle = colors.shield;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(bodyCenterX, bodyCenterY, 30, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = colors.shield;
            ctx.beginPath();
            ctx.arc(bodyCenterX, bodyCenterY, 30, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Actualizar posición del jugador
    function updatePlayer() {
        if (rightPressed && playerX < gameCanvas.width - playerWidth) {
            playerX += playerSpeed;
        } else if (leftPressed && playerX > 0) {
            playerX -= playerSpeed;
        }
        
        // Actualizar efectos de los power-ups
        if (shieldActive) {
            shieldTimeLeft--;
            if (shieldTimeLeft <= 0) shieldActive = false;
        }
        
        if (speedBoostActive) {
            speedTimeLeft--;
            if (speedTimeLeft <= 0) {
                speedBoostActive = false;
                playerSpeed = basePlayerSpeed;
            }
        }
    }

    // Generar un nuevo objeto (obstáculo o power-up)
    function spawnObject() {
        if (frameCount % objectSpawnRate !== 0) return;
        
        const objectChance = Math.random();
        let objectType;
        let specificType;
        
        if (objectChance < 0.6) {
            objectType = 'stressor';
            const stressorTypes = [gameObjectTypes.WORK, gameObjectTypes.BILL, gameObjectTypes.BOSS];
            specificType = stressorTypes[Math.floor(Math.random() * stressorTypes.length)];
        } else if (objectChance < 0.85) {
            objectType = 'relaxer';
            // Ahora se incluyen 3 relajantes
            const relaxerTypes = [gameObjectTypes.SLEEP, gameObjectTypes.EXERCISE, gameObjectTypes.DIETA];
            specificType = relaxerTypes[Math.floor(Math.random() * relaxerTypes.length)];
        } else {
            objectType = 'supplement';
            const supplementTypes = [gameObjectTypes.ZPRO, gameObjectTypes.VMAX, gameObjectTypes.DULTRA];
            specificType = supplementTypes[Math.floor(Math.random() * supplementTypes.length)];
        }
        
        const newObject = {
            x: Math.random() * (gameCanvas.width - objectWidth),
            y: -objectHeight,
            width: objectWidth,
            height: objectHeight,
            speed: objectSpeed + Math.random() * 1.5,
            type: specificType
        };
        
        if (objectType === 'stressor') {
            stressors.push(newObject);
        } else if (objectType === 'relaxer') {
            relaxers.push(newObject);
        } else {
            supplements.push(newObject);
        }
    }

    // Actualizar y dibujar todos los objetos
    function updateAndDrawObjects() {
        // Estresores
        for (let i = stressors.length - 1; i >= 0; i--) {
            const obj = stressors[i];
            obj.y += obj.speed;
            let stressorImage = null;
            if (obj.type.name === 'Trabajo') {
                stressorImage = imgCarpeta;
            } else if (obj.type.name === 'Jefe') {
                stressorImage = imgJefe;
            } else if (obj.type.name === 'Factura') {
                stressorImage = imgAuto;
            }
            if (stressorImage) {
                ctx.drawImage(stressorImage, obj.x, obj.y, obj.width, obj.height);
            } else {
                ctx.fillStyle = obj.type.color;
                ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
            }
            
            if (checkCollision(obj)) {
                if (!shieldActive) {
                    energy += obj.type.value;
                    showFloatingText(obj.x, obj.y, obj.type.value, 'red');
                } else {
                    showFloatingText(obj.x, obj.y, "¡Bloqueado!", 'cyan');
                }
                stressors.splice(i, 1);
            }
            if (obj.y > gameCanvas.height) stressors.splice(i, 1);
        }
        
        // Relajantes
        for (let i = relaxers.length - 1; i >= 0; i--) {
            const obj = relaxers[i];
            obj.y += obj.speed;
            let relaxerImage = null;
            if (obj.type.name === 'Dormir') {
                relaxerImage = imgDormir;
            } else if (obj.type.name === 'Ejercicio') {
                relaxerImage = imgEjercicio;
            } else if (obj.type.name === 'Dieta') {
                relaxerImage = imgDieta;
            }
            if (relaxerImage) {
                ctx.drawImage(relaxerImage, obj.x, obj.y, obj.width, obj.height);
            } else {
                ctx.fillStyle = obj.type.color;
                ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
            }
            
            if (checkCollision(obj)) {
                energy += obj.type.value;
                score += 5;
                showFloatingText(obj.x, obj.y, "+" + obj.type.value, 'green');
                relaxers.splice(i, 1);
            }
            if (obj.y > gameCanvas.height) relaxers.splice(i, 1);
        }
        
        // Suplementos
        for (let i = supplements.length - 1; i >= 0; i--) {
            const obj = supplements[i];
            obj.y += obj.speed;
            let supplementImage = null;
            if (obj.type.name === 'Z-pro') {
                supplementImage = imgZpro;
            } else if (obj.type.name === 'V-max') {
                supplementImage = imgVmax;
            } else if (obj.type.name === 'D-ultra') {
                supplementImage = imgDultra;
            }
            if (supplementImage) {
                ctx.drawImage(supplementImage, obj.x, obj.y, obj.width, obj.height);
            } else {
                ctx.fillStyle = obj.type.color;
                ctx.beginPath();
                ctx.arc(obj.x + obj.width/2, obj.y + obj.height/2, obj.width/2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            if (checkCollision(obj)) {
                applySupplementEffect(obj.type);
                showFloatingText(obj.x, obj.y, "¡" + obj.type.name + "!", 'purple');
                score += 20;
                supplements.splice(i, 1);
            }
            if (obj.y > gameCanvas.height) supplements.splice(i, 1);
        }
    }

    // Verificar colisión entre jugador y objeto
    function checkCollision(obj) {
        return playerX < obj.x + obj.width &&
               playerX + playerWidth > obj.x &&
               playerY < obj.y + obj.height &&
               playerY + playerHeight > obj.y;
    }

    // Aplicar efecto del suplemento
    function applySupplementEffect(supplementType) {
        switch(supplementType.effect) {
            case 'fullEnergy':
                energy = 100;
                showFloatingText(playerX, playerY - 20, "¡Energía al 100%!", 'purple');
                break;
            case 'speedBoost':
                speedBoostActive = true;
                speedTimeLeft = 300;
                playerSpeed = basePlayerSpeed * 1.7;
                showFloatingText(playerX, playerY - 20, "¡Velocidad aumentada!", 'orange');
                break;
            case 'shield':
                shieldActive = true;
                shieldTimeLeft = 300;
                showFloatingText(playerX, playerY - 20, "¡Escudo activado!", 'cyan');
                break;
        }
    }

    // Mostrar texto flotante
    let floatingTexts = [];
    function showFloatingText(x, y, text, color) {
        floatingTexts.push({ x, y, text, color, life: 50 });
    }

    // Actualizar y dibujar textos flotantes
    function updateFloatingTexts() {
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            const txt = floatingTexts[i];
            txt.y -= 2;
            txt.life--;
            ctx.fillStyle = txt.color;
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(txt.text, txt.x, txt.y);
            if (txt.life <= 0) floatingTexts.splice(i, 1);
        }
        ctx.textAlign = 'left';
    }

    // Dibujar la UI inferior
    function drawBottomUI() {
        ctx.fillStyle = '#333';
        ctx.fillRect(0, gameCanvas.height - bottomUIHeight, gameCanvas.width, bottomUIHeight);
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Puntuación: ${score}`, 10, gameCanvas.height - bottomUIHeight/2);
        const maxBarWidth = 200;
        const barWidth = (energy / 100) * maxBarWidth;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'right';
        ctx.fillText('Nivel de Estrés:', gameCanvas.width - maxBarWidth - 15, gameCanvas.height - bottomUIHeight/2 - 15);
        ctx.fillStyle = '#666';
        ctx.fillRect(gameCanvas.width - maxBarWidth - 10, gameCanvas.height - bottomUIHeight/2, maxBarWidth, barHeight);
        let barColor;
        if (energy > 60) barColor = 'green';
        else if (energy > 30) barColor = 'orange';
        else barColor = 'red';
        ctx.fillStyle = barColor;
        ctx.fillRect(gameCanvas.width - maxBarWidth - 10, gameCanvas.height - bottomUIHeight/2, barWidth, barHeight);
        let statusY = gameCanvas.height - bottomUIHeight/2 + 20;
        ctx.textAlign = 'center';
        ctx.font = '12px Arial';
        if (shieldActive) {
            ctx.fillStyle = colors.dultra;
            ctx.fillText(`D-ultra: ${Math.ceil(shieldTimeLeft / 60)}s`, gameCanvas.width / 4, statusY);
        }
        if (speedBoostActive) {
            ctx.fillStyle = colors.vmax;
            ctx.fillText(`V-max: ${Math.ceil(speedTimeLeft / 60)}s`, gameCanvas.width / 2, statusY);
        }
        ctx.textAlign = 'left';
    }

    // Pantalla de Game Over
    function checkGameOver() {
        if (energy <= 0) {
            gameOver = true;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
            ctx.fillStyle = 'white';
            ctx.font = '36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('¡ESTRÉS MÁXIMO!', gameCanvas.width / 2, gameCanvas.height / 3);
            ctx.font = '24px Arial';
            ctx.fillText(`Puntuación final: ${score}`, gameCanvas.width / 2, gameCanvas.height / 2);
            ctx.font = '20px Arial';
            ctx.fillStyle = colors.zpro;
            ctx.fillText('¡Z-pro te ayuda a controlar el estrés!', gameCanvas.width / 2, gameCanvas.height / 2 + 50);
            ctx.fillStyle = 'white';
            ctx.font = '18px Arial';
            ctx.fillText('Presiona R para reiniciar', gameCanvas.width / 2, gameCanvas.height / 2 + 100);
            return true;
        }
        return false;
    }

    // Pantalla de inicio
    function drawStartScreen() {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GENXBIO', gameCanvas.width / 2, 120);
        ctx.font = 'bold 24px Arial';
        ctx.fillText('Estrés Vs. Bienestar', gameCanvas.width / 2, 160);
        ctx.font = '18px Arial';
        ctx.fillStyle = '#ccc';
        ctx.fillText('Controles: Flechas izquierda y derecha', gameCanvas.width / 2, 220);
        let yPos = 280;
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText('Objetos del juego:', gameCanvas.width / 2, yPos);
        // Ejemplo: se muestra la imagen del estresor (carpeta) en la pantalla de inicio
        yPos += 40;
        ctx.drawImage(imgCarpeta, gameCanvas.width / 2 - 100, yPos, 20, 20);
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.fillText('Estresores - ¡Evítalos!', gameCanvas.width / 2 - 70, yPos + 15);
        // Relajantes (se mostrarán las imágenes precargadas)
        yPos += 40;
        ctx.drawImage(imgDormir, gameCanvas.width / 2 - 100, yPos, 20, 20);
        ctx.fillStyle = 'white';
        ctx.fillText('Relajantes - ¡Recógelos!', gameCanvas.width / 2 - 70, yPos + 15);
        // Suplementos
        yPos += 40;
        ctx.fillStyle = colors.zpro;
        ctx.beginPath();
        ctx.arc(gameCanvas.width / 2 - 90, yPos + 10, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.fillText('Z-pro - ¡Recarga tu energía!', gameCanvas.width / 2 - 70, yPos + 15);
        yPos += 40;
        ctx.fillStyle = colors.vmax;
        ctx.beginPath();
        ctx.arc(gameCanvas.width / 2 - 90, yPos + 10, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.fillText('V-max - ¡Aumenta tu velocidad!', gameCanvas.width / 2 - 70, yPos + 15);
        yPos += 40;
        ctx.fillStyle = colors.dultra;
        ctx.beginPath();
        ctx.arc(gameCanvas.width / 2 - 90, yPos + 10, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.fillText('D-ultra - ¡Activa un escudo!', gameCanvas.width / 2 - 70, yPos + 15);
        // Botón para iniciar
        yPos += 70;
        const buttonWidth = 200;
        const buttonHeight = 50;
        const buttonX = gameCanvas.width / 2 - buttonWidth / 2;
        const buttonY = yPos;
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('¡JUGAR!', gameCanvas.width / 2, buttonY + 33);
        gameCanvas.onclick = function(e) {
            const rect = gameCanvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            if (mouseX >= buttonX && mouseX <= buttonX + buttonWidth &&
                mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {
                gameState = 'playing';
                gameCanvas.onclick = null;
            }
        };
    }

    // Estado del juego ('start', 'playing', 'over')
    let gameState = 'start';

    // Bucle principal del juego
    function gameLoop() {
        if (gameState === 'start') {
            drawStartScreen();
        } else if (gameState === 'playing') {
            ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height - bottomUIHeight);
            energy = Math.max(0, Math.min(100, energy));
            frameCount++;
            spawnObject();
            updatePlayer();
            updateAndDrawObjects();
            drawPlayer();
            updateFloatingTexts();
            drawBottomUI();
            if (checkGameOver()) gameState = 'over';
        }
        requestAnimationFrame(gameLoop);
    }

    // Estilizar el canvas y contenedor
    gameCanvas.style.border = '2px solid #333';
    gameCanvas.style.backgroundColor = '#f0f0f0';
    gameCanvas.style.display = 'block';
    gameCanvas.style.margin = '0 auto';
    
    if (gameCanvas && !document.getElementById('gameContainer')) {
        const gameContainer = document.createElement('div');
        gameContainer.id = 'gameContainer';
        gameContainer.style.textAlign = 'center';
        gameContainer.style.marginTop = '20px';
        document.body.appendChild(gameContainer);
        const gameTitle = document.createElement('h1');
        gameTitle.textContent = 'GenXbio: Estrés Vs. Bienestar';
        gameTitle.style.fontFamily = 'Arial, sans-serif';
        gameTitle.style.color = '#333';
        gameContainer.appendChild(gameTitle);
        gameContainer.appendChild(gameCanvas);
    }
    
    gameLoop();
});
