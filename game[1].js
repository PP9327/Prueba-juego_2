// Prototipo simple Moto Montaña
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const scoreEl = document.getElementById('score');

let W, H;
function resize(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  W = canvas.width; H = canvas.height;
}
window.addEventListener('resize', resize);
resize();

// Juego
let running = false;
let lastTime = 0;
let spawnTimer = 0;
let speed = 200; // px/s world speed (increasing)
let distance = 0;
let obstacles = [];

// Moto (player)
const player = {
  x: W*0.2,
  y: H*0.75,
  w: 60,
  h: 30,
  vy: 0,
  onGround: true
};

const gravity = 1500;
const jumpVel = -600;

function reset(){
  running = true;
  lastTime = performance.now();
  spawnTimer = 0;
  speed = 200;
  distance = 0;
  obstacles = [];
  player.x = W*0.2; player.y = H*0.75; player.vy = 0; player.onGround = true;
  scoreEl.textContent = 'Puntuación: 0';
  requestAnimationFrame(loop);
}

startBtn.addEventListener('click', ()=> { if(!running) reset(); });

// Input
const keys = {};
window.addEventListener('keydown', (e)=>{
  keys[e.code] = true;
  if(e.code === 'KeyR') { if(!running) reset(); }
});
window.addEventListener('keyup', (e)=> keys[e.code] = false);

canvas.addEventListener('touchstart', (e)=>{
  e.preventDefault();
  // Si tocas izquierda/derecha según x
  const t = e.touches[0];
  if(t.clientX < W/2) { keys['ArrowLeft']=true; setTimeout(()=>keys['ArrowLeft']=false,150); }
  else { keys['ArrowRight']=true; setTimeout(()=>keys['ArrowRight']=false,150); }
});

function spawnObstacle(){
  // Obstáculo básico: rectángulo que se mueve hacia la izquierda
  const size = 30 + Math.random()*40;
  const gapBottom = H*0.75;
  obstacles.push({
    x: W + 50,
    y: gapBottom - size,
    w: size,
    h: size,
    passed: false
  });
}

function update(dt){
  if(!running) return;
  // increase speed slowly
  speed += 5 * dt;

  // distance scoring
  distance += speed * dt * 0.01;
  scoreEl.textContent = 'Puntuación: ' + Math.floor(distance);

  // spawn obstacles
  spawnTimer -= dt;
  if(spawnTimer <= 0){
    spawnObstacle();
    // spawn interval decreases as speed increases
    spawnTimer = 1.2 - Math.min(0.9, speed/1000);
  }

  // update obstacles
  for(let i = obstacles.length-1; i>=0; i--){
    const ob = obstacles[i];
    ob.x -= speed * dt;
    if(!ob.passed && ob.x + ob.w < player.x){
      ob.passed = true;
      distance += 5; // bonus for passing
    }
    if(ob.x + ob.w < -50) obstacles.splice(i,1);
  }

  // player movement horizontal simple
  if(keys['ArrowLeft'] || keys['KeyA']) player.x -= 300*dt;
  if(keys['ArrowRight'] || keys['KeyD']) player.x += 300*dt;
  // clamp
  player.x = Math.max(20, Math.min(W-20-player.w, player.x));

  // jump
  if((keys['ArrowUp'] || keys['Space'] || keys['KeyW']) && player.onGround){
    player.vy = jumpVel;
    player.onGround = false;
  }

  // physics
  player.vy += gravity * dt;
  player.y += player.vy * dt;
  const groundY = H*0.75;
  if(player.y + player.h >= groundY){
    player.y = groundY - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  // collisions
  for(const ob of obstacles){
    if(rectIntersect(player.x, player.y, player.w, player.h, ob.x, ob.y, ob.w, ob.h)){
      running = false;
      scoreEl.textContent = 'Juego terminado — Puntuación: ' + Math.floor(distance) + ' | Presiona R o Start';
    }
  }
}

function rectIntersect(x1,y1,w1,h1,x2,y2,w2,h2){
  return !(x2 > x1 + w1 || x2 + w2 < x1 || y2 > y1 + h1 || y2 + h2 < y1);
}

function draw(){
  // clear
  ctx.clearRect(0,0,W,H);

  // sky (already background), draw distant mountains (parallax)
  drawMountains();
  // ground
  ctx.fillStyle = '#4a2e0a';
  ctx.fillRect(0, H*0.75, W, H*0.25);

  // obstacles
  for(const ob of obstacles){
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
    // simple shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(ob.x+5, H*0.75-6, ob.w, 6);
  }

  // moto (player) simple shape
  ctx.save();
  ctx.translate(player.x + player.w/2, player.y + player.h/2);
  // tilt while jumping/falling
  const tilt = Math.max(-0.6, Math.min(0.6, player.vy / 600));
  ctx.rotate(tilt);
  ctx.fillStyle = '#ffeb3b';
  ctx.fillRect(-player.w/2, -player.h/2, player.w, player.h);
  // rueda delantera
  ctx.fillStyle = '#212121';
  ctx.beginPath();
  ctx.arc(-player.w/3, player.h/2, player.h/3, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(player.w/3, player.h/2, player.h/3, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawMountains(){
  // far mountains
  ctx.fillStyle = '#2e7d32';
  ctx.beginPath();
  ctx.moveTo(0,H*0.75);
  ctx.lineTo(W*0.2,H*0.5);
  ctx.lineTo(W*0.4,H*0.75);
  ctx.lineTo(W*0.6,H*0.55);
  ctx.lineTo(W*0.8,H*0.75);
  ctx.lineTo(W,H*0.6);
  ctx.lineTo(W,H);
  ctx.lineTo(0,H);
  ctx.closePath();
  ctx.fill();
}

function loop(ts){
  const dt = Math.min(0.05, (ts - lastTime)/1000);
  lastTime = ts;
  update(dt);
  draw();
  if(running) requestAnimationFrame(loop);
}

window.addEventListener('keydown', (e)=>{
  if(e.code === 'KeyP'){ running = !running; if(running){ lastTime = performance.now(); requestAnimationFrame(loop);} }
});

// initial draw
draw();