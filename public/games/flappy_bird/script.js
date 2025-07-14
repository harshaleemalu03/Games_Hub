document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');
    const bird = document.getElementById('bird');
    const scoreElement = document.getElementById('score');
    const gameOverScreen = document.getElementById('game-over');
    const finalScoreElement = document.getElementById('final-score');
    const restartBtn = document.getElementById('restart-btn');

    let birdY = 200;
    let velocity = 0;
    let gravity = 0.6;
    let jumpStrength = -10;
    let gameRunning = false;
    let score = 0;
    let pipes = [];
    let pipeTimer = 0;
    let pipeInterval = 3000; 
    let animationFrame;

    function startGame() {
        birdY = 200;
        velocity = 0;
        score = 0;
        pipes.forEach(p => p.element.remove());
        pipes = [];

        gameRunning = true;
        scoreElement.textContent = score;
        gameOverScreen.classList.add('hidden');
        bird.style.top = `${birdY}px`;
        pipeTimer = Date.now();

        generatePipe(); 

        animationFrame = requestAnimationFrame(gameLoop);
    }

    function endGame() {
        gameRunning = false;
        cancelAnimationFrame(animationFrame);
        finalScoreElement.textContent = score;
        gameOverScreen.classList.remove('hidden');
    }

    function jump() {
        if (gameRunning) {
            velocity = jumpStrength;
        }
    }

    function generatePipe() {
        const gapHeight = 250;  
        const containerHeight = gameContainer.clientHeight;
        const pipeX = gameContainer.clientWidth;
        const topHeight = Math.random() * (containerHeight - gapHeight - 100) + 50;
        const bottomHeight = containerHeight - topHeight - gapHeight;

        const topPipe = document.createElement('div');
        topPipe.className = 'pipe pipe-top';
        topPipe.style.left = `${pipeX}px`;
        topPipe.style.height = `${topHeight}px`;
        gameContainer.appendChild(topPipe);

        const bottomPipe = document.createElement('div');
        bottomPipe.className = 'pipe pipe-bottom';
        bottomPipe.style.left = `${pipeX}px`;
        bottomPipe.style.height = `${bottomHeight}px`;
        gameContainer.appendChild(bottomPipe);

        pipes.push({ element: topPipe, x: pipeX, passed: false });
        pipes.push({ element: bottomPipe, x: pipeX, passed: false });
    }

    function gameLoop() {
        if (!gameRunning) return;

        velocity += gravity;
        birdY += velocity;
        bird.style.top = `${birdY}px`;

        const birdRect = bird.getBoundingClientRect();
        const containerRect = gameContainer.getBoundingClientRect();

        // Hit floor or ceiling
        if (birdY < 0 || birdY + bird.offsetHeight > gameContainer.clientHeight) {
            endGame();
            return;
        }

        // Pipe logic
        const now = Date.now();
        if (now - pipeTimer > pipeInterval) {
            generatePipe();
            pipeTimer = now;
        }

        for (let i = pipes.length - 1; i >= 0; i--) {
            const pipe = pipes[i];
            pipe.x -= 3; 
            pipe.element.style.left = `${pipe.x}px`;

            if (!pipe.passed && pipe.x + pipe.element.offsetWidth < bird.offsetLeft) {
                pipe.passed = true;
                score++;
                scoreElement.textContent = score;
            }

            const pipeRect = pipe.element.getBoundingClientRect();
            if (
                birdRect.right > pipeRect.left &&
                birdRect.left < pipeRect.right &&
                birdRect.top < pipeRect.bottom &&
                birdRect.bottom > pipeRect.top
            ) {
                endGame();
                return;
            }

            if (pipe.x + pipe.element.offsetWidth < 0) {
                pipe.element.remove();
                pipes.splice(i, 1);
            }
        }

        animationFrame = requestAnimationFrame(gameLoop);
    }

    gameContainer.addEventListener('click', jump);
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            jump();
        }
    });

    restartBtn.addEventListener('click', () => {
        startGame();
    });

    startGame();
});
// ✅ Export Button Logic
document.addEventListener("DOMContentLoaded", () => {
  const exportBtn = document.createElement("button");
  exportBtn.textContent = "Export Game";
  exportBtn.id = "export-btn";
  Object.assign(exportBtn.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: "999",
    padding: "10px 20px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    fontFamily: "monospace",
    fontSize: "14px",
    cursor: "pointer",
    borderRadius: "5px"
  });
  document.body.appendChild(exportBtn);

  exportBtn.addEventListener("click", async () => {
    const settings = JSON.parse(localStorage.getItem("gameSettings")) || {};
    const bgImage = settings.backgroundImage || "";

    const zip = new JSZip();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Flappy Export</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="game-container">
    <img id="bird" src="bird.png" alt="Bird">
    <div id="score">0</div>
    <div id="game-over" class="hidden">
      <h2>Game Over!</h2>
      <p>Score: <span id="final-score">0</span></p>
      <button id="restart-btn">Play Again</button>
    </div>
  </div>

  <script src="script.js"></script>
  <script>
    document.body.style.backgroundImage = "url('${bgImage}')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
  </script>
</body>
</html>
    `.trim();

    const css = `/* style.css */ body { margin: 0; overflow: hidden; }`;
    const js = document.querySelector("script[src='script.js']") ? "// Your logic goes here..." : "";

    zip.file("index.html", html);
    zip.file("style.css", css);
    zip.file("script.js", js);

    if (bgImage.startsWith("data:image")) {
      const ext = bgImage.includes("png") ? "png" : "jpg";
      const base64 = bgImage.split(",")[1];
      zip.file(`background.${ext}`, base64, { base64: true });
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flappy-export.zip";
    a.click();
  });
});
