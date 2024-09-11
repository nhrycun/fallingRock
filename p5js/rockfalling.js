// p5.js sketch to simulate a rock falling down a large hole with more realistic physics

let rock;
let hole;
const gravity = 9.8; // Earth's gravity in m/s^2 for realism
const airResistance = 0.999; // Air resistance coefficient to slow down falling speed
const elasticity = 0.7; // Elasticity for wall bounces
const friction = 0.9; // Horizontal friction for wall bounces
const terminalVelocity = 20; // Approximate terminal velocity (cap on speed)
let camera;
let flash = false;
let flashTimer = 0;
const flashDuration = 10; // How long the flash lasts in frames
const collisionBuffer = 2; // Tolerance buffer for collisions

function setup() {
  createCanvas(400, 600);
  frameRate(60); // Set a consistent framerate

  let rockRadius = 10; // Set rock radius
  rock = new Rock(width / 2 + random(-5, 5), 50, rockRadius); // Slight horizontal offset
  
  // Make the hole wider than the rock by a larger margin
  let holeWidth = rockRadius * 5; // Wider than the rock
  hole = new Hole(width / 2 - holeWidth / 2, 400, holeWidth, 10000); // Hole wider than the rock
  camera = new Camera();
}

function draw() {
  // Flash background if rock hit the walls
  if (flash) {
    background(255, 0, 0); // Red flash background
    flashTimer++;
    if (flashTimer > flashDuration) {
      flash = false; // End flash after a few frames
      flashTimer = 0;
    }
  } else {
    background(200); // Normal background
  }
  
  // Update camera position to follow the rock
  camera.update(rock.pos.y);
  
  push();
  translate(0, -camera.y);
  
  // Display the hole
  hole.display();
  
  // Update and display the rock
  rock.applyForce(createVector(0, gravity * rock.mass)); // Apply downward gravity force
  rock.update();
  rock.checkCollision(hole);
  rock.display();
  
  pop();
  
  // Display depth information and framerate
  fill(0);
  textSize(16);
  text(`Depth: ${Math.floor(rock.pos.y - hole.y)}m`, 10, 20);
  text(`Framerate: ${Math.floor(frameRate())}`, 10, 40); // Display framerate
}

class Rock {
  constructor(x, y, radius) {
    this.pos = createVector(x, y);
    this.vel = createVector(random(-0.5, 0.5), 0); // Reduced initial horizontal velocity
    this.acc = createVector(0, 0);
    this.radius = radius;
    this.mass = 1;
    this.rotation = 0;
    this.angularVel = random(-0.02, 0.02); // Slower rotation to avoid visual artifacts
  }
  
  applyForce(force) {
    let f = p5.Vector.div(force, this.mass);
    this.acc.add(f);
  }
  
  update() {
    this.vel.add(this.acc);
    
    // Air resistance proportional to square of velocity
    let airResistForce = this.vel.copy().mult(-0.02 * this.vel.magSq());
    this.vel.add(airResistForce);
    
    // Limit falling speed to terminal velocity
    this.vel.y = constrain(this.vel.y, -terminalVelocity, terminalVelocity);
    
    // Apply air resistance scaling and movement
    this.pos.add(this.vel);
    
    // Constrain rock's position so it doesn't fall out of bounds
    this.pos.y = constrain(this.pos.y, 0, hole.y + hole.depth - this.radius);
    
    this.acc.set(0, 0); // Reset acceleration
    
    // Update angular velocity for rotation
    this.rotation += this.angularVel;
  }
  
  checkCollision(hole) {
    // Add a collision buffer to avoid immediate wall contact triggering collisions
    if (this.pos.x - this.radius - collisionBuffer < hole.x) {
      this.pos.x = hole.x + this.radius + collisionBuffer;
      this.vel.x *= -elasticity; // Bounce with elasticity
      this.vel.x *= friction; // Apply friction to horizontal movement

      // If the horizontal velocity is too small, nudge it to avoid getting stuck
      if (abs(this.vel.x) < 0.1) {
        this.vel.x = random(1, 2); // Nudge right for left wall
      }

      triggerFlash(); // Trigger flash when collision occurs
    } else if (this.pos.x + this.radius + collisionBuffer > hole.x + hole.width) {
      this.pos.x = hole.x + hole.width - this.radius - collisionBuffer;
      this.vel.x *= -elasticity; // Bounce with elasticity
      this.vel.x *= friction; // Apply friction to horizontal movement

      // If the horizontal velocity is too small, nudge it to avoid getting stuck
      if (abs(this.vel.x) < 0.1) {
        this.vel.x = random(-2, -1); // Nudge left for right wall
      }

      triggerFlash(); // Trigger flash when collision occurs
    }
  }
  
  display() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.rotation); // Rotate rock based on angular velocity
    fill(100);
    noStroke();
    
    // Draw a square instead of a circle, with some randomness to simulate a rough rock
    let size = this.radius * 2;
    rectMode(CENTER);
    rect(0, 0, size + random(-2, 2), size + random(-2, 2));
    
    pop();
  }
}

class Hole {
  constructor(x, y, width, depth) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.depth = depth;
  }
  
  display() {
    fill(0); // Black for better visibility of the hole
    noStroke();
    
    // Draw a fixed-width hole as a black rectangle
    rect(this.x, this.y, this.width, this.depth);
    
    // Draw rock layers to give a visual sense of depth
    stroke(30);
    for (let y = this.y; y < this.y + this.depth; y += 50) {
      line(this.x, y, this.x + this.width, y);
    }
  }
}

class Camera {
  constructor() {
    this.y = 0;
  }
  
  update(rockY) {
    this.y = rockY - height / 2;
    this.y = constrain(this.y, 0, hole.y + hole.depth - height);
  }
}

// Function to trigger a flash effect
function triggerFlash() {
  if (!flash) { // Prevent constant flashing
    flash = true;
    flashTimer = 0; // Reset flash timer when collision happens
  }
}
