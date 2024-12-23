const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 750;

const ORIGIN = [250, 250];

const ARR_X = 25;
const ARR_Y = 12;

const INIT_SCATTER_MULT = 0.0005;

const INIT_THETA_MIN = 1.0;
const INIT_THETA_MAX = 1.1;

const CIRCLE_DIAMETER = 15;
const CIRCLE_RADIUS = CIRCLE_DIAMETER / 2;
const LINE1_LENGTH = 120;
const LINE2_LENGTH = 120;

const MASS1 = 1;
const MASS2 = 1;

const ACCEL_CONST = 8;

const GRID_MIDPOINT_X = ORIGIN[0];
const GRID_TOP_Y = ORIGIN[1] + LINE1_LENGTH + LINE2_LENGTH + CIRCLE_DIAMETER;
const GRID_CELL_WIDTH = CIRCLE_RADIUS;
const GRID_CELL_HEIGHT = CIRCLE_RADIUS;

function Pendulum(theta1, theta2){
  this.theta1 = theta1;
  this.theta2 = theta2;

  this.omega1 = 0;
  this.omega2 = 0;

  this.step = function() {
    const delta = this.theta2 - this.theta1;

    // angular velocity change
    const denominator_common = 2 * MASS1 + MASS2 - MASS2 * cos(2 * this.theta1 - 2 * this.theta2);
    const denominator1 = LINE1_LENGTH * denominator_common;
    const denominator2 = LINE2_LENGTH * denominator_common;

    const d_omega1 = (-ACCEL_CONST * (2 * MASS1 + MASS2) * sin(this.theta1) - MASS2 * ACCEL_CONST * sin(this.theta1 - 2 * this.theta2) - 2 * sin(this.theta1 - this.theta2) * MASS2 * (this.omega2 ** 2 * LINE2_LENGTH + this.omega1 ** 2 * LINE1_LENGTH * cos(this.theta1 - this.theta2))) / denominator1;

    const d_omega2 = (2 * sin(this.theta1 - this.theta2) * (this.omega1 ** 2 * LINE1_LENGTH * (MASS1 + MASS2) + ACCEL_CONST * (MASS1 + MASS2) * cos(this.theta1) + this.omega2 ** 2 * LINE2_LENGTH * MASS2 * cos(this.theta1 - this.theta2))) / denominator2;

    this.omega1 += d_omega1;
    this.omega2 += d_omega2;
    if (isNaN(this.omega1) ||
      isNaN(this.omega2) ||
      abs(this.omega1) > PI ||
      abs(this.omega2) > PI)
    {
      console.log(this);
    }

    this.theta1 += this.omega1;
    this.theta2 += this.omega2;
    this.theta1 %= TAU;
    this.theta2 %= TAU;
  };

  this.draw = function(initX, initY) {
    const x1 = initX + LINE1_LENGTH * sin(this.theta1);
    const y1 = initY + LINE1_LENGTH * cos(this.theta1);

    line(initX, initY, x1, y1);
    ellipse(x1, y1, CIRCLE_DIAMETER, CIRCLE_DIAMETER);

    const x2 = x1 + LINE2_LENGTH * sin(this.theta2);
    const y2 = y1 + LINE2_LENGTH * cos(this.theta2);

    line(x1, y1, x2, y2);
    ellipse(x2, y2, CIRCLE_DIAMETER, CIRCLE_DIAMETER);
  };

  this.getColor = function() {
    if (isNaN(this.theta1) || isNaN(this.theta2))
    {
      return [140, 70, 40];
    }
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
