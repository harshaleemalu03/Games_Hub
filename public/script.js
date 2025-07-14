document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const startBtn = document.getElementById("start-btn");
  const startScreen = document.getElementById("start-screen");
  const mainContent = document.getElementById("main-content");
  const starContainer = document.querySelector(".star-container");

  let selectedGame = null;

  // Start screen transition
  document.body.style.backgroundColor = "#0d0d0d";
  startBtn.addEventListener("click", () => {
    startScreen.style.opacity = "0";
    setTimeout(() => {
      startScreen.style.display = "none";
      mainContent.style.display = "block";
      mainContent.classList.add("visible");
    }, 600);
  });

  // Create stars background
  const totalStars = 60;
  const starArray = [];

  for (let i = 0; i < totalStars; i++) {
    const star = document.createElement("div");
    star.classList.add("star");
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    const speed = Math.random() * 0.5 + 0.2;
    star.style.left = `${x}px`;
    star.style.top = `${y}px`;
    starContainer.appendChild(star);
    starArray.push({ el: star, initialY: y, speed });
  }

  // Special shooting star
  const specialStar = document.createElement("div");
  specialStar.classList.add("star", "special");
  starContainer.appendChild(specialStar);

  // Parallax effect
  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    starArray.forEach(({ el, initialY, speed }) => {
      const newY = initialY + scrollY * speed;
      el.style.top = `${newY}px`;
      if (newY > window.innerHeight + 100) {
        el.style.opacity = 0;
      }
    });
  });

  // Game Card Selection
  document.querySelectorAll(".card-cover").forEach(card => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".card-cover").forEach(c => c.classList.remove("selected-game"));

      const link = card.closest("a");
      selectedGame = link.getAttribute("href");
      card.classList.add("selected-game");

      document.querySelector('.game-ai-section-glow').scrollIntoView({
        behavior: 'smooth'
      });
    });
  });

  // Prompt Submission
  const form = document.querySelector(".game-prompt-form");
  const input = document.querySelector(".prompt-input");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const promptText = input.value.trim();
    if (!selectedGame) {
      alert("Please select a game first!");
      return;
    }

    try {
      const btn = form.querySelector("button");
      btn.disabled = true;
      btn.textContent = "Generating...";

      const response = await fetch("https://games-hub-3igi.onrender.com/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText })
      });

      const data = await response.json();

      if (data?.image) {
        localStorage.setItem("gameSettings", JSON.stringify({
          backgroundImage: data.image,
          prompt: promptText
        }));
        window.location.href = selectedGame;
      } else {
        alert("Failed to generate image.");
      }

    } catch (err) {
      console.error("ClipDrop error:", err);
      alert("Failed to generate image. Try again!");
    } finally {
      const btn = form.querySelector("button");
      btn.disabled = false;
      btn.textContent = "Generate";
    }
  });
});

// Background gradient animation
let angle = 0;
function animateGradient() {
  angle += 0.003;
  const x = 50 + Math.sin(angle) * 10;
  const y = 50 + Math.cos(angle) * 10;
  document.body.style.background = `radial-gradient(circle at ${x}% ${y}%, #2d0d48, rgba(0, 0, 0, 1) 40%)`;
  requestAnimationFrame(animateGradient);
}
animateGradient();
