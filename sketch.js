const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 750;

const ORIGIN = [250, 250];

const ARR_X = 20;
const ARR_Y = 10;

const INIT_SCATTER_MULT = 0.005;

const INIT_THETA_MIN = 0.05;
const INIT_THETA_MAX = 0.25;

const CIRCLE_RADIUS = 15;
const LINE1_LENGTH = 120;
const LINE2_LENGTH = 120;

const MASS1 = 1;
const MASS2 = 1;

const ACCEL_CONST = 0.81;

const GRID_MIDPOINT_X = ORIGIN[0];
const GRID_TOP_Y = ORIGIN[1] + LINE1_LENGTH + LINE2_LENGTH + CIRCLE_RADIUS;
const GRID_CELL_WIDTH = CIRCLE_RADIUS / 2;
const GRID_CELL_HEIGHT = CIRCLE_RADIUS / 2;

function Pendulum(theta1, theta2){
  this.theta1 = theta1;
  this.theta2 = theta2;

  this.omega1 = 0;
  this.omega2 = 0;

  this.step = function() {
    const delta = this.theta2 - this.theta1;

    // angular velocity change
    const denominator = LINE1_LENGTH * (2 * MASS1 + MASS2 - MASS2 * cos(2 * this.theta1 - 2 * this.theta2));

    const d_omega1 = (-ACCEL_CONST * (2 * MASS1 + MASS2) * sin(this.theta1) - MASS2 * ACCEL_CONST * sin(this.theta1 - 2 * this.theta2) - 2 * sin(this.theta1 - this.theta2) * MASS2 * (this.omega2 ** 2 * LINE2_LENGTH + this.omega1 ** 2 * LINE1_LENGTH * cos(this.theta1 - this.theta2))) / denominator;

    const d_omega2 = (2 * sin(this.theta1 - this.theta2) * (this.omega1 ** 2 * LINE1_LENGTH * (MASS1 + MASS2) + ACCEL_CONST * (MASS1 + MASS2) * cos(this.theta1) + this.omega2 ** 2 * LINE2_LENGTH * MASS2 * cos(this.theta1 - this.theta2))) / denominator;

    this.omega1 += d_omega1;
    this.omega2 += d_omega2;

    this.theta1 += this.omega1;
    this.theta2 += this.omega2;
  };

  this.draw = function(initX, initY) {
    const x1 = initX + LINE1_LENGTH * sin(this.theta1);
    const y1 = initY + LINE1_LENGTH * cos(this.theta1);

    line(initX, initY, x1, y1);
    ellipse(x1, y1, CIRCLE_RADIUS, CIRCLE_RADIUS);

    const x2 = x1 + LINE2_LENGTH * sin(this.theta2);
    const y2 = y1 + LINE2_LENGTH * cos(this.theta2);

    line(x1, y1, x2, y2);
    ellipse(x2, y2, CIRCLE_RADIUS, CIRCLE_RADIUS);
  };

  this.getColor = function() {
    return [0, sin(this.theta1) ** 2 * 255, sin(this.theta2) ** 2 * 255];
  }
};

let pendula;

function setup() {
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  fill(0, 0, 0);

  const rootT1 = random([-1, 1]) * random(INIT_THETA_MIN, INIT_THETA_MAX) * PI;
  const rootT2 = random([-1, 1]) * random(INIT_THETA_MIN, INIT_THETA_MAX) * PI;

  pendula = Array(ARR_Y).fill().map(
    (o, y) => Array(ARR_X).fill().map(
      (o, x) => {
        const initT1 = rootT1 + y / (0.5 * ARR_Y) * PI * INIT_SCATTER_MULT;
        const initT2 = rootT2 + x / (0.5 * ARR_Y) * PI * INIT_SCATTER_MULT;
        return new Pendulum(initT1, initT2);
      }
    )
  );
}

function draw() {
  clear();

  pendula.forEach(
    (arr, y) => arr.forEach(
      (pendulum, x) => {
        const color = pendulum.getColor();
        fill(...color);
        stroke(...color);

        rect(
          GRID_MIDPOINT_X + (x - (arr.length - 1) / 2) * GRID_CELL_WIDTH,
          GRID_TOP_Y + (y + 1) * GRID_CELL_HEIGHT,
          GRID_CELL_WIDTH,
          GRID_CELL_HEIGHT
        );
        pendulum.draw(...ORIGIN);

        pendulum.step();
      }
    )
  );
}

/* alt. idea: draw two pendulums and lerp n pendulums between them */
