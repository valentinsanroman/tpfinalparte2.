// =========================================
//  MISIÓN ESTELAR - Con imágenes y sonido
//  Créditos originales: Valentín San Román y Luz Calderón
//Url: 
// =========================================

// ---- Recursos (imagenes y sonidos) ----
let musicaFondo = null;
let sonidoDisparo = null;
let sonidoExplosion = null;

let imgFondo = null;
let imgNave = null;
let imgAsteroide = null;
let imgHeart = null;

function preload() {
  // Cargar sonidos si p5.sound está disponible
  try {
    musicaFondo = loadSound("musica.mp3", ()=>{}, ()=>{ musicaFondo = null; });
  } catch(e) { musicaFondo = null; }

  try {
    sonidoDisparo = loadSound("disparo.wav", ()=>{}, ()=>{ sonidoDisparo = null; });
  } catch(e) { sonidoDisparo = null; }

  try {
    sonidoExplosion = loadSound("explosion.wav", ()=>{}, ()=>{ sonidoExplosion = null; });
  } catch(e) { sonidoExplosion = null; }

  // Cargar imágenes
  try { imgFondo = loadImage("./data/fondo.jpg", ()=>{}, ()=>{ imgFondo = null; }); } catch(e) { imgFondo = null; }
  try { imgNave = loadImage("./data/nave.png", ()=>{}, ()=>{ imgNave = null; }); } catch(e) { imgNave = null; }
  try { imgAsteroide = loadImage("./data/asteroide.png", ()=>{}, ()=>{ imgAsteroide = null; }); } catch(e) { imgAsteroide = null; }
  try { imgHeart = loadImage("./data/heart.jpg", ()=>{}, ()=>{ imgHeart = null; }); } catch(e) { imgHeart = null; }
}

// -----------------------------------------
let juego;
let estrellas = [];

function setup() {
  createCanvas(800, 500);
  textFont('monospace');

  // Iniciar música
  if (musicaFondo && !musicaFondo.isPlaying()) {
    musicaFondo.setVolume(0.4);
    musicaFondo.loop();
  }

  juego = new Juego();

  for (let i = 0; i < 160; i++) estrellas.push(new Estrella());

  noCursor();
}

function draw() {
  background(5, 5, 20); //si no hay background se buguea XD
  // Fondo
  if (imgFondo) image(imgFondo, 0, 0, width, height);
  else background(5, 5, 20);

  // Estrellas
  for (let s of estrellas) {
    s.mover();
    s.mostrar();
  }

  juego.mostrar();
  juego.actualizar();

  // Cursor
  push();
  noStroke();
  fill(200);
  ellipse(mouseX, mouseY, 6);
  pop();
}

function keyPressed() {
  if (juego) juego.teclaPresionada(keyCode);
}

function keyReleased() {
  if (juego) juego.teclaSoltada(keyCode);
}

function mousePressed() {
  if (juego) juego.click(mouseX, mouseY);
}

//////////////////////////
// CLASE JUEGO
//////////////////////////
class Juego {
  constructor() {
    this.estado = "menu";
    this.nave = new Nave();
    this.asteroides = [];
    this.balas = [];
    this.puntaje = 0;
    this.vidas = 3;
    this.escudo = 100;
    this.dificultad = "normal";
    this.particulas = [];
    this.confetti = [];

    // botones
    this.botonJugar = new Boton(width / 2 - 90, 220, 180, 46, "Jugar");
    this.botonInstrucciones = new Boton(width / 2 - 90, 280, 180, 42, "Instrucciones");
    this.botonCreditos = new Boton(width / 2 - 90, 330, 180, 42, "Créditos");
    this.botonVolver = new Boton(20, 440, 110, 36, "Volver");
    this.botonesDif = [
      new Boton(width / 2 - 200, 230, 120, 44, "Fácil"),
      new Boton(width / 2 - 60, 230, 120, 44, "Normal"),
      new Boton(width / 2 + 80, 230, 120, 44, "Difícil")
    ];
    this.botonReiniciar = new Boton(width / 2 - 70, height / 2 + 40, 140, 40, "Reiniciar");
    this.ultimaOleada = 0;
  }

  actualizar() {
    if (this.estado === "jugando") {

      this.nave.mover();

      // dificultad
      let freq = this.dificultad === "fácil" ? 80 :
                 this.dificultad === "normal" ? 60 : 40;

      let escudoRec = this.dificultad === "fácil" ? 0.25 :
                      this.dificultad === "normal" ? 0.12 : 0.06;

      if (frameCount % freq === 0) this.asteroides.push(new Asteroide());

      this.escudo = min(this.escudo + escudoRec, 100);

      // actualizar balas
      for (let i = this.balas.length - 1; i >= 0; i--) {
        let b = this.balas[i];
        b.mover();
        if (b.fueraDePantalla()) this.balas.splice(i, 1);
      }

      // asteroides y colisiones
      for (let i = this.asteroides.length - 1; i >= 0; i--) {
        let a = this.asteroides[i];
        a.mover();

        // colisión bala-asteroide
        let destroyed = false;

        for (let j = this.balas.length - 1; j >= 0; j--) {
          let b = this.balas[j];

          if (dist(b.x, b.y, a.x, a.y) < a.tam / 2) {
            for (let k = 0; k < 10; k++) this.particulas.push(new Particula(a.x, a.y));

            if (sonidoExplosion) sonidoExplosion.play();

            this.balas.splice(j, 1);
            this.asteroides.splice(i, 1);
            this.puntaje++;

            destroyed = true;
            break;
          }
        }

        if (destroyed) continue;

        // colisión nave-asteroide
        if (this.nave.colision(a)) {
          const baseDamage = 1.0;

          if (this.escudo > 0) {
            let damage = baseDamage * 0.5;
            this.nave.vida -= damage;
            this.escudo -= 40;
            if (this.escudo < 0) this.escudo = 0;
          } else {
            this.nave.vida -= baseDamage;
          }

          for (let k = 0; k < 12; k++) this.particulas.push(new Particula(this.nave.x, this.nave.y));

          this.asteroides.splice(i, 1);

          if (this.nave.vida <= 0) {
            this.estado = "perder";
            if (musicaFondo) musicaFondo.stop();
          }

          continue;
        }

        if (a.y > height + a.tam) this.asteroides.splice(i, 1);
      }

      // partículas
      for (let i = this.particulas.length - 1; i >= 0; i--) {
        this.particulas[i].mover();
        if (this.particulas[i].vida <= 0) this.particulas.splice(i, 1);
      }

      // victoria
      if (this.puntaje >= 25) {
        this.estado = "ganar";
        for (let i = 0; i < 80; i++) this.confetti.push(new Confetti(random(width), random(-200, -20)));
        if (musicaFondo) musicaFondo.stop();
      }
    }

    // confetti
    if (this.estado === "ganar") {
      for (let i = this.confetti.length - 1; i >= 0; i--) {
        this.confetti[i].mover();
        if (this.confetti[i].y > height + 20) this.confetti.splice(i, 1);
      }
    }
  }

  mostrar() {
    if (this.estado === "menu") this.menuPrincipal();
    else if (this.estado === "instrucciones") this.pantallaInstrucciones();
    else if (this.estado === "creditos") this.pantallaCreditos();
    else if (this.estado === "dificultad") this.menuDificultad();
    else if (this.estado === "jugando") this.pantallaJuego();
    else if (this.estado === "ganar") this.pantallaGanar();
    else if (this.estado === "perder") this.pantallaPerder();

    if (["jugando","ganar","perder"].includes(this.estado)) {
      for (let a of this.asteroides) a.mostrar();
      for (let p of this.particulas) p.mostrar();
    }

    for (let c of this.confetti) c.mostrar();
  }

  click(x, y) {
    if (this.estado === "menu") {
      if (this.botonJugar.click(x, y)) this.estado = "dificultad";
      else if (this.botonInstrucciones.click(x, y)) this.estado = "instrucciones";
      else if (this.botonCreditos.click(x, y)) this.estado = "creditos";
    }

    else if (this.estado === "dificultad") {
      for (let b of this.botonesDif) {
        if (b.click(x, y)) {
          this.dificultad = b.texto.toLowerCase();
          this.reiniciar();
          this.estado = "jugando";
        }
      }
      if (this.botonVolver.click(x, y)) this.estado = "menu";
    }

    else if (["instrucciones","creditos"].includes(this.estado)) {
      if (this.botonVolver.click(x, y)) this.estado = "menu";
    }

    else if (this.estado === "jugando") {
      if (this.botonReiniciar.click(x, y)) this.reiniciar();
    }

    else if (["ganar","perder"].includes(this.estado)) {
      if (this.botonVolver.click(x, y)) {
        this.estado = "menu";
        this.confetti = [];
        if (musicaFondo && !musicaFondo.isPlaying()) {
          musicaFondo.setVolume(0.4);
          musicaFondo.loop();
        }
      }
    }
  }
  teclaPresionada(keyCode) {
    if (this.estado === "menu") {
      if (keyCode === ENTER) this.estado = "dificultad";
    }

    else if (this.estado === "jugando") {
      if (keyCode === LEFT_ARROW) this.nave.moverIzquierda = true;
      if (keyCode === RIGHT_ARROW) this.nave.moverDerecha = true;

      if (keyCode === 32) { // disparo con barra espaciadora
        this.balas.push(new Bala(this.nave.x, this.nave.y));
        if (sonidoDisparo) sonidoDisparo.play();
      }
    }

    else if (["ganar","perder"].includes(this.estado) && keyCode === ENTER) {
      this.reiniciar();
      this.estado = "jugando";
    }
  }

  teclaSoltada(keyCode) {
    if (keyCode === LEFT_ARROW) this.nave.moverIzquierda = false;
    if (keyCode === RIGHT_ARROW) this.nave.moverDerecha = false;
  }

  reiniciar() {
    this.nave = new Nave();
    this.asteroides = [];
    this.balas = [];
    this.puntaje = 0;
    this.escudo = 100;
    this.particulas = [];
    this.confetti = [];

    if (musicaFondo && !musicaFondo.isPlaying()) {
      musicaFondo.setVolume(0.4);
      musicaFondo.loop();
    }
  }

  // ----- Pantallas -----
  menuPrincipal() {
    push();
    translate(width / 2, 120 + sin(frameCount * 0.02) * 6);
    textAlign(CENTER);
    textSize(42);
    fill(255);
    text("🚀 MISIÓN ESTELAR 🚀", 0, 0);
    pop();

    this.botonJugar.mostrarHover();
    this.botonInstrucciones.mostrarHover();
    this.botonCreditos.mostrarHover();

    fill(200);
    textSize(13);
    textAlign(CENTER);
    text("Creado por Valentín San Román y Luz Calderón", width / 2, height - 28);
  }

  menuDificultad() {
    fill(255);
    textAlign(CENTER);
    textSize(26);
    text("Selecciona dificultad", width / 2, 180);

    for (let b of this.botonesDif) b.mostrarHover();

    this.botonVolver.mostrarHover();
  }

  pantallaInstrucciones() {
    fill(255);
    textAlign(CENTER);
    textSize(28);
    text("INSTRUCCIONES", width / 2, 110);

    textSize(16);
    text("← → : mover  •  ESPACIO : disparar\nTu escudo reduce el daño a la mitad.\nEvitá asteroides y alcanzá 25 puntos para ganar.",
      width / 2, 220);

    this.botonVolver.mostrarHover();
  }

  pantallaCreditos() {
    fill(255);
    textAlign(CENTER);
    textSize(28);
    text("CRÉDITOS", width / 2, 110);

    textSize(16);
    text("Diseño y programación:\nValentín San Román\nApoyo creativo:\nLuz Calderón",
      width / 2, 220);

    this.botonVolver.mostrarHover();
  }

  pantallaJuego() {
    this.nave.mostrar();

    // puntaje
    fill(255);
    textSize(16);
    textAlign(LEFT);
    text("Puntaje: " + this.puntaje, 20, 28);

    // vidas
    let vidasEnteras = floor(max(this.nave.vida, 0));
    for (let i = 0; i < 3; i++) {
      if (i < vidasEnteras) fill(255, 0, 0);
      else if (i === vidasEnteras && this.nave.vida - vidasEnteras >= 0.5) fill(255, 140, 0);
      else fill(100);

      image (imgHeart,20 + i * 30, 55, 20, 20);
    }

    fill(255);
    textSize(12);
    text("Vida: " + nf(this.nave.vida, 1, 1), 20, 80);

    // escudo
    fill(255);
    textSize(12);
    text("Escudo", 20, 105);

    noStroke();
    fill(40);
    rect(20, 110, 150, 12, 6);

    fill(0, 180, 255);
    rect(20, 110, map(this.escudo, 0, 100, 0, 150), 12, 6);

    // reiniciar botón
    this.botonReiniciar.mostrarHover();

    // balas
    for (let b of this.balas) b.mostrar();
  }

  pantallaGanar() {
    fill(0, 255, 100);
    textAlign(CENTER);
    textSize(36);
    text("¡MISIÓN COMPLETA! 🌟", width / 2, height / 2 - 40);

    textSize(18);
    fill(255);
    text("Excelente trabajo, Astronauta.", width / 2, height / 2);

    this.botonVolver.mostrarHover();
  }

  pantallaPerder() {
    fill(255, 60, 60);
    textAlign(CENTER);
    textSize(36);
    text("¡MISIÓN FALLIDA 💥!", width / 2, height / 2 - 40);

    textSize(18);
    fill(255);
    text("Intentá nuevamente. Presioná Volver.", width / 2, height / 2);

    this.botonVolver.mostrarHover();
  }
}

//////////////////////////
// CLASE NAVE
//////////////////////////
class Nave {
  constructor() {
    this.x = width / 2;
    this.y = height - 60;
    this.vel = 5.5;
    this.moverIzquierda = false;
    this.moverDerecha = false;
    this.disparos = [];
    this.vida = 3.0;
    this.anim = 0;
    this.cooldown = 0;
  }

  mover() {
    if (this.moverIzquierda) this.x -= this.vel;
    if (this.moverDerecha) this.x += this.vel;

    this.x = constrain(this.x, 20, width - 20);

    this.anim += 0.14;
    if (this.cooldown > 0) this.cooldown--;

    // actualizar disparos internos
    for (let i = this.disparos.length - 1; i >= 0; i--) {
      this.disparos[i].mover();
      if (this.disparos[i].fueraDePantalla()) this.disparos.splice(i, 1);
    }
  }

  mostrar() {
    push();
    translate(this.x, this.y);

    if (imgNave) {
      pop();
      imageMode(CENTER);
      image(imgNave, this.x, this.y, 60, 80);
    } else {
      noStroke();
      fill(100, 200, 255);
      ellipse(0, 0, 46, 70);

      fill(255, 160, 0);
      triangle(-14, 30, 14, 30, 0, 54 + sin(this.anim) * 6);

      fill(255);
      ellipse(0, -12, 24, 24);

      let globalEsc = juego.escudo;
      if (globalEsc > 8) {
        noFill();
        stroke(0, 200, 255, map(globalEsc, 0, 100, 20, 160));
        strokeWeight(2);
        ellipse(0, 0, 72 + sin(this.anim) * 4, 96 + sin(this.anim) * 4);
      }

      pop();
    }

    // mostrar disparos
    for (let d of this.disparos) d.mostrar();
  }

  disparar() {
    if (this.cooldown <= 0) {
      this.disparos.push(new Disparo(this.x, this.y - 36));
      this.cooldown = 8;

      if (sonidoDisparo) sonidoDisparo.play();
    }
  }

  colision(asteroide) {
    let d = dist(this.x, this.y, asteroide.x, asteroide.y);
    return d < (asteroide.tam / 2 + 18);
  }
}

//////////////////////////
// BALAS Y DISPAROS
//////////////////////////
class Bala {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vel = 11;
  }

  mover() {
    this.y -= this.vel;
  }

  mostrar() {
    noStroke();
    fill(255, 240, 120);
    ellipse(this.x, this.y, 18); //

    fill(255, 150, 0, 120);
    ellipse(this.x, this.y + 6, 14, 10); //
  }

  fueraDePantalla() {
    return this.y < -10;
  }
}

class Disparo {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vel = 9;
    this.trazo = [];
    this.alpha = 255;
  }

  mover() {
    this.trazo.push({ x: this.x, y: this.y });
    if (this.trazo.length > 12) this.trazo.shift();

    this.y -= this.vel;
    this.alpha -= 6;
  }

  mostrar() {
    noFill();
    stroke(0, 210, 255, this.alpha * 0.9);
    strokeWeight(3);

    beginShape();
    for (let p of this.trazo) vertex(p.x, p.y);
    endShape();

    noStroke();
    fill(0, 210, 255, this.alpha);
    ellipse(this.x, this.y, 8, 16);
  }

  fueraDePantalla() {
    return this.y < -20 || this.alpha <= 0;
  }
}
//////////////////////////
// ASTEROIDE
//////////////////////////

class Asteroide {
  constructor() {
    this.x = random(30, width - 30);
    this.y = -30;
    this.vel = random(2.5, 5.2);
    this.tam = random(26, 48);
    this.rot = random(TWO_PI);
    this.rotSpeed = random(-0.04, 0.04);
  }

  mover() {
    this.y += this.vel;
    this.rot += this.rotSpeed;
  }

  mostrar() {
    if (imgAsteroide) {
      push();
      translate(this.x, this.y);
      rotate(this.rot);
      imageMode(CENTER);
      image(imgAsteroide, 0, 0, this.tam, this.tam);
      pop();
      return;
    }

    // fallback dibujo
    push();
    translate(this.x, this.y);
    rotate(this.rot);
    fill(130);
    noStroke();
    ellipse(0, 0, this.tam, this.tam * 0.86);

    fill(100);
    ellipse(-this.tam * 0.15, -this.tam * 0.12, this.tam * 0.26);
    ellipse(this.tam * 0.2, this.tam * 0.05, this.tam * 0.22);
    pop();
  }
}

//////////////////////////
// ESTRELLA
//////////////////////////

class Estrella {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.vel = random(0.3, 1.7);
    this.tam = random(1, 3.2);
    this.brightness = random(180, 255);
  }

  mover() {
    if (juego && juego.estado === "menu" && dist(mouseX, mouseY, width / 2, height / 2) < 200) {
      this.y += this.vel * 1.8;
    } else {
      this.y += this.vel;
    }

    if (this.y > height) {
      this.y = -random(10, 40);
      this.x = random(width);
    }
  }

  mostrar() {
    noStroke();
    fill(this.brightness);
    ellipse(this.x, this.y, this.tam);
  }
}

//////////////////////////
// PARTICULA
//////////////////////////

class Particula {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-3, 3);
    this.vy = random(-3, 3);
    this.tam = random(2, 4);
    this.vida = 120;
  }

  mover() {
    this.x += this.vx;
    this.y += this.vy;
    this.vida -= 5;
  }

  mostrar() {
    fill(255, 200, 0, map(this.vida, 0, 120, 0, 255));
    noStroke();
    ellipse(this.x, this.y, this.tam);
  }
}

//////////////////////////
// CONFETTI
//////////////////////////

class Confetti {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-1.5, 1.5);
    this.vy = random(1, 3);
    this.size = random(4, 8);
    this.col = color(random(100, 255), random(100, 255), random(100, 255));
    this.ang = random(TWO_PI);
    this.spin = random(-0.1, 0.1);
  }

  mover() {
    this.x += this.vx;
    this.y += this.vy;
    this.ang += this.spin;
  }

  mostrar() {
    push();
    translate(this.x, this.y);
    rotate(this.ang);
    noStroke();
    fill(this.col);
    rectMode(CENTER);
    rect(0, 0, this.size, this.size * 0.6);
    pop();
  }
}

//////////////////////////
// BOTON (RECONSTRUIDO)
//////////////////////////

class Boton {
  constructor(x, y, w, h, texto) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.texto = texto;
    this.hover = false;
  }

  isHover(mx, my) {
    return mx > this.x && mx < this.x + this.w &&
           my > this.y && my < this.y + this.h;
  }

  mostrarHover() {
    this.hover = this.isHover(mouseX, mouseY);

    push();
    rectMode(CORNER);
    noStroke();

    // Fondo con efecto hover
    fill(this.hover ? color(100, 100, 180) : color(60, 60, 100));
    rect(this.x, this.y, this.w, this.h, 10);

    // Borde suave si está en hover
    if (this.hover) {
      stroke(0, 200, 255);
      noFill();
      strokeWeight(2);
      rect(this.x - 2, this.y - 2, this.w + 4, this.h + 4, 12);
    }

    // Texto
    noStroke();
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(this.hover ? 17 : 15);
    text(this.texto, this.x + this.w / 2, this.y + this.h / 2);

    pop();
  }

  click(mx, my) {
    return this.isHover(mx, my);
  }
}

//////////////////////////
// FIN DEL ARCHIVO
//////////////////////////
