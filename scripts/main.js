function Vector(x, y) {
  this.x = x;
  this.y = y;
}

function magn(vec) {
  return Math.sqrt((vec.x**2) + (vec.y**2));
}

function proj(a, b) {//b -re
  let mlt = ((a.x * b.x) + (a.y * b.y)) / magn(b)**2;
  return new Vector(b.x * mlt, b.y * mlt);
}

function getdeg(vec1, vec2) {
  let temp = ((vec1.x * vec2.x + vec1.y * vec2.y) / (magn(vec1)) / magn(vec2));
  return (Math.acos(temp) / Math.PI) * 180;
}



function Ball(x, y, r, m, t) {
  this.pos = new Vector(x, y);
  this.force = new Vector(0, 0);
  this.radius = r;
  this.mass = m;
  this.type = t;
}

function Rect(x, y, w, h) {
  this.pos = new Vector(x, y);
  this.width = w;
  this.height = h;
}

function overlap(s1, e1, s2, e2) {
  let min = e1;
  if (e2 < e1) { min = e2; }

  let max = s1;
  if (s2 > s1) { max = s2; }

  let ret = min - max;

  if (ret > 0) { return ret; }
  else { return 0; }

  return (s1 >= s2 && s1 <= e2) || (s2 >= s1 && s2 <= e1);
}

function ballToBall(ball1, ball2) {
  let dv = new Vector(ball2.pos.x - ball1.pos.x, ball2.pos.y - ball1.pos.y);
  if (magn(dv) < (ball1.radius + ball2.radius)) {
    return true;
  }
  else {
    return false;
  }
}

function ballToRect(ball, rect) {
  let xaxis = new Vector(1, 0);
  let yaxis = new Vector(0, 1);

  let rtoy = proj(new Vector(rect.pos.x, rect.pos.y), yaxis);
  let rtox = proj(new Vector(rect.pos.x, rect.pos.y), xaxis);

  let ctoy = proj(new Vector(ball.pos.x, ball.pos.y), yaxis);
  let ctox = proj(new Vector(ball.pos.x, ball.pos.y), xaxis);

  let oly = overlap(magn(rtoy), magn(rtoy) + rect.height, magn(ctoy) - ball.radius, magn(ctoy) + ball.radius);
  let olx = overlap(magn(rtox), magn(rtox) + rect.width, magn(ctox) - ball.radius, magn(ctox) + ball.radius);

  return new Vector(olx, oly);
}



var board = {
  canvas : document.getElementById("cv1"),
  mousePos : { x : 1, y : 0, but : 0 , whl : 0},
  clickLock : true,
  set : function() {
    this.context = this.canvas.getContext("2d");
    this.clickLock = true;
    this.canvas.addEventListener("mousemove", getMousePos, false);
    this.canvas.addEventListener("mousedown", clickStart, false);
    this.canvas.addEventListener("mouseup", clickEnd, false);
    this.canvas.addEventListener("wheel", onWheel, false);
    this.canvas.addEventListener("mousedown", function(evt) { evt.preventDefault(); }, false);
    this.canvas.addEventListener("contextmenu", function(evt) { evt.preventDefault(); }, false);
  },
  resize : function(w, h) {
    this.canvas.width = Number(w);
    this.canvas.height = Number(h);
  }
};

function getMousePos(evt) {
  let rect = board.canvas.getBoundingClientRect();
  board.mousePos.x = Math.floor(evt.clientX - rect.left);
  board.mousePos.y = Math.floor(evt.clientY - rect.top);
}

function clickStart(evt) {
  board.mousePos.but = evt.buttons;
}

function clickEnd(evt) {
  board.mousePos.but = 0;
}

function onWheel(evt) {
  evt.preventDefault();
  if (evt.deltaY > 0) {
    board.mousePos.whl = -1;
  }
  else if (evt.deltaY < 0) {
    board.mousePos.whl = 1;
  }
}



var game = {
  balls : [],
  rects : [],
  selected : -1,
  power : 1000,
  //ballPic : new Image(0, 0),
  set : function(p) {
    //this.ballPic.src = "/gombfoci/scripts/ball.png?" + new Date().getTime();
    this.frames = 0;
    this.balls.push(new Ball(50, 50, 10, 4, 0));
    this.balls.push(new Ball(100, 100, 15, 6, 1));
    this.balls.push(new Ball(200, 200, 15, 6, 2));
    this.rects.push(new Rect(500, 100, 100, 100));
  },
};

function isMoving() {
  let temp = 0;
  let limit = 0.5;
  for (let i = 0; i < game.balls.length; i++) {
    temp += magn(game.balls[i].force);
  }
  if (temp > limit) { return true; }
  else { return false; }
}

function updateGame() {
  let resist = 0.01;

  game.power += board.mousePos.whl * 1000;
  if (game.power < 0) { game.power = 0; }
  if (game.power > 15000) { game.power = 15000; }
  board.mousePos.whl = 0;
  document.getElementById("power").innerHTML = game.power;

  if (board.mousePos.but == 0) { board.clickLock = false; }
  else if ((board.mousePos.but > 0) && !board.clickLock && !isMoving()) {
    board.clickLock = true;

    if ((board.mousePos.but == 1) && (game.selected >= 0)) {
      let dir = new Vector(board.mousePos.x - game.balls[game.selected].pos.x, board.mousePos.y - game.balls[game.selected].pos.y)
      m = magn(dir);
      dir.x /= m;
      dir.y /= m;
      game.balls[game.selected].force.x += dir.x * game.power;
      game.balls[game.selected].force.y += dir.y * game.power;
      game.selected = -1;
    }
    if (board.mousePos.but == 2) {
      let sel = false;
      for (let i = 0; (i < game.balls.length) && !sel; i++) {
        dv = new Vector(game.balls[i].pos.x - board.mousePos.x, game.balls[i].pos.y - board.mousePos.y);
        if ((magn(dv) < (game.balls[i].radius)) && (game.balls[i].type != 0)) {
          sel = true;
          game.selected = i;
        }
        else {
          game.selected = -1;
        }
      }
    }
  }

  for (let i = 0; i < game.balls.length; i++) {

    if ((game.balls[i].pos.x + game.balls[i].radius) > board.canvas.width) {
      if (game.balls[i].force.x > 0) { game.balls[i].force.x *= -1; }
    }
    if ((game.balls[i].pos.x - game.balls[i].radius) < 0) {
      if (game.balls[i].force.x < 0) { game.balls[i].force.x *= -1; }
    }

    if ((game.balls[i].pos.y + game.balls[i].radius) > board.canvas.height) {
      if (game.balls[i].force.y > 0) { game.balls[i].force.y *= -1; }
    }
    if ((game.balls[i].pos.y - game.balls[i].radius) < 0) {
      if (game.balls[i].force.y < 0) { game.balls[i].force.y *= -1; }
    }

    for (let j = 0; j < game.rects.length; j++) {
      let temp = ballToRect(game.balls[i], game.rects[j]);
      if (temp.x > 0 && temp.y > 0) {
        let to = undefined;
        if (temp.x < temp.y) {
          to = new Vector(temp.x, 0);
        }
        else {
          to = new Vector(0, temp.y);
        }
        let tforce = proj(game.balls[i].force, to);
        game.balls[i].force.x -= tforce.x * 2;
        game.balls[i].force.y -= tforce.y * 2;
      }
    }

    for (let j = 0; j < game.balls.length; j++) {
      if (j != i) {
        if (ballToBall(game.balls[i], game.balls[j])) {//vegp - kezdop
          let to = new Vector(game.balls[j].pos.x - game.balls[i].pos.x, game.balls[j].pos.y - game.balls[i].pos.y);

          if (getdeg(to, game.balls[i].force) <= 90) {
            let tforce = proj(game.balls[i].force, to);
            let tmass = game.balls[i].mass + game.balls[j].mass;
            game.balls[i].force.x -= ((tforce.x * 2) / tmass) * game.balls[j].mass;
            game.balls[i].force.y -= ((tforce.y * 2) / tmass) * game.balls[j].mass;
            game.balls[j].force.x += ((tforce.x * 2) / tmass) * game.balls[i].mass;
            game.balls[j].force.y += ((tforce.y * 2) / tmass) * game.balls[i].mass;
          }
        }
      }
    }

    game.balls[i].pos.x += game.balls[i].force.x / 1000;
    game.balls[i].pos.y += game.balls[i].force.y / 1000;
    game.balls[i].force.x -= game.balls[i].force.x * resist;
    game.balls[i].force.y -= game.balls[i].force.y * resist;
  }
}

function drawGame() {
  board.context.clearRect(0, 0, board.canvas.width, board.canvas.height);
  let ctx = board.context;

  for (let i = 0; i < game.rects.length; i++) {
    ctx.beginPath();
    ctx.rect(game.rects[i].pos.x, game.rects[i].pos.y, game.rects[i].width, game.rects[i].height)
    ctx.strokeStyle = "black";
    ctx.stroke();
  }

  for (let i = 0; i < game.balls.length; i++) {
    ctx.beginPath();
    ctx.arc(game.balls[i].pos.x, game.balls[i].pos.y, game.balls[i].radius, 0, 2 * Math.PI);

    if (game.balls[i].type == 1) {
      ctx.strokeStyle = "red";
      ctx.fillStyle = "red";
    }
    else if (game.balls[i].type == 2) {
      ctx.strokeStyle = "blue";
      ctx.fillStyle = "blue";
    }
    else {
      ctx.strokeStyle = "black";
      ctx.fillStyle = "black";
    }

    ctx.fill();
    ctx.stroke();

    if (i == game.selected) {
      ctx.beginPath();
      ctx.arc(game.balls[i].pos.x, game.balls[i].pos.y, game.balls[i].radius + 10, 0, 2 * Math.PI);
      ctx.strokeStyle = "black";
      ctx.stroke();
    }
    //ctx.drawImage(game.ballPic, game.balls[i].pos.x - (31 / 2), game.balls[i].pos.y - (31 / 2), 31, 31);
  }
}



var menu = {
  title : "",
  options : []
};



board.set();
var interval1 = undefined;
var interval2 = undefined;

function start() {
  game.set();
  board.resize(640, 480);
  clearInterval(interval1);
  clearInterval(interval2);
  interval1 = setInterval(drawGame, 10)
  interval2 = setInterval(updateGame, 1);
}
