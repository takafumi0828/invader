const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const game = {
  width: canvas.width,
  height: canvas.height,
  running: true,
  lastTime: 0,
  message: "",
  score: 0,
  level: 1,
};

const keys = {
  left: false,
  right: false,
};

const player = {
  width: 56,
  height: 14,
  x: canvas.width / 2 - 28,
  y: canvas.height - 40,
  speed: 320,
  cooldown: 0,
};

const bullets = [];
const enemyBullets = [];
let enemies = [];

function resetEnemies() {
  enemies = [];
  const cols = 10;
  const rows = 4 + Math.min(game.level - 1, 3);
  const spacingX = 52;
  const spacingY = 36;
  const offsetX = 70;
  const offsetY = 56;

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      enemies.push({
        x: offsetX + c * spacingX,
        y: offsetY + r * spacingY,
        width: 30,
        height: 22,
        alive: true,
      });
    }
  }
}

const enemyState = {
  direction: 1,
  speed: 30,
  dropDistance: 18,
  shootTimer: 0,
};

function restartGame() {
  game.running = true;
  game.message = "";
  game.score = 0;
  game.level = 1;
  player.x = canvas.width / 2 - player.width / 2;
  player.cooldown = 0;
  bullets.length = 0;
  enemyBullets.length = 0;
  enemyState.direction = 1;
  enemyState.speed = 30;
  enemyState.shootTimer = 0;
  resetEnemies();
}

function nextLevel() {
  game.level += 1;
  enemyState.speed += 10;
  enemyState.direction = 1;
  bullets.length = 0;
  enemyBullets.length = 0;
  resetEnemies();
}

function endGame(text) {
  game.running = false;
  game.message = text;
}

function isColliding(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function shootPlayerBullet() {
  if (player.cooldown > 0 || !game.running) return;
  bullets.push({
    x: player.x + player.width / 2 - 2,
    y: player.y - 12,
    width: 4,
    height: 12,
    speed: 420,
  });
  player.cooldown = 0.25;
}

function enemyShoot(deltaTime) {
  enemyState.shootTimer -= deltaTime;
  if (enemyState.shootTimer > 0 || !game.running) return;

  const living = enemies.filter((enemy) => enemy.alive);
  if (living.length === 0) return;

  const shooter = living[Math.floor(Math.random() * living.length)];
  enemyBullets.push({
    x: shooter.x + shooter.width / 2 - 2,
    y: shooter.y + shooter.height,
    width: 4,
    height: 10,
    speed: 180 + game.level * 10,
  });

  enemyState.shootTimer = Math.max(0.25, 1.2 - game.level * 0.1);
}

function update(deltaTime) {
  if (!game.running) return;

  if (keys.left) {
    player.x -= player.speed * deltaTime;
  }
  if (keys.right) {
    player.x += player.speed * deltaTime;
  }

  player.x = Math.max(8, Math.min(game.width - player.width - 8, player.x));
  player.cooldown = Math.max(0, player.cooldown - deltaTime);

  bullets.forEach((bullet) => {
    bullet.y -= bullet.speed * deltaTime;
  });

  enemyBullets.forEach((bullet) => {
    bullet.y += bullet.speed * deltaTime;
  });

  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    if (bullets[i].y + bullets[i].height < 0) {
      bullets.splice(i, 1);
    }
  }

  for (let i = enemyBullets.length - 1; i >= 0; i -= 1) {
    const bullet = enemyBullets[i];

    if (bullet.y > game.height) {
      enemyBullets.splice(i, 1);
      continue;
    }

    if (isColliding(bullet, player)) {
      endGame("ゲームオーバー！ Enterで再開");
      return;
    }
  }

  let hitEdge = false;
  const livingEnemies = enemies.filter((enemy) => enemy.alive);

  livingEnemies.forEach((enemy) => {
    enemy.x += enemyState.direction * enemyState.speed * deltaTime;

    if (enemy.x <= 8 || enemy.x + enemy.width >= game.width - 8) {
      hitEdge = true;
    }
  });

  if (hitEdge) {
    enemyState.direction *= -1;
    livingEnemies.forEach((enemy) => {
      enemy.y += enemyState.dropDistance;
      if (enemy.y + enemy.height >= player.y) {
        endGame("侵略されました… Enterで再開");
      }
    });
  }

  for (let bi = bullets.length - 1; bi >= 0; bi -= 1) {
    let removed = false;
    for (let ei = enemies.length - 1; ei >= 0; ei -= 1) {
      const enemy = enemies[ei];
      if (!enemy.alive) continue;

      if (isColliding(bullets[bi], enemy)) {
        enemy.alive = false;
        bullets.splice(bi, 1);
        game.score += 10;
        removed = true;
        break;
      }
    }
    if (removed) continue;
  }

  if (enemies.every((enemy) => !enemy.alive)) {
    nextLevel();
  }

  enemyShoot(deltaTime);
}

function drawPlayer() {
  ctx.fillStyle = "#72f2b2";
  ctx.fillRect(player.x, player.y, player.width, player.height);
  ctx.fillRect(player.x + player.width / 2 - 5, player.y - 8, 10, 8);
}

function drawEnemies() {
  enemies.forEach((enemy) => {
    if (!enemy.alive) return;
    ctx.fillStyle = "#ff6b8a";
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    ctx.fillStyle = "#ffd2dc";
    ctx.fillRect(enemy.x + 5, enemy.y + 6, 5, 5);
    ctx.fillRect(enemy.x + enemy.width - 10, enemy.y + 6, 5, 5);
  });
}

function drawBullets() {
  ctx.fillStyle = "#fff76a";
  bullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

  ctx.fillStyle = "#7fd0ff";
  enemyBullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });
}

function drawHud() {
  ctx.fillStyle = "#d4ddff";
  ctx.font = "16px sans-serif";
  ctx.fillText(`Score: ${game.score}`, 12, 24);
  ctx.fillText(`Level: ${game.level}`, game.width - 90, 24);

  if (!game.running) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(0, 0, game.width, game.height);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(game.message, game.width / 2, game.height / 2);
    ctx.textAlign = "start";
  }
}

function draw() {
  ctx.clearRect(0, 0, game.width, game.height);
  drawPlayer();
  drawEnemies();
  drawBullets();
  drawHud();
}

function gameLoop(timestamp) {
  const deltaTime = Math.min(0.033, (timestamp - game.lastTime) / 1000 || 0);
  game.lastTime = timestamp;

  update(deltaTime);
  draw();

  requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", (event) => {
  if (event.code === "ArrowLeft") keys.left = true;
  if (event.code === "ArrowRight") keys.right = true;
  if (event.code === "Space") {
    shootPlayerBullet();
    event.preventDefault();
  }
  if (event.code === "Enter" && !game.running) {
    restartGame();
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code === "ArrowLeft") keys.left = false;
  if (event.code === "ArrowRight") keys.right = false;
});

restartGame();
requestAnimationFrame(gameLoop);
