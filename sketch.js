p5.disableFriendlyErrors = true;

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 750;

const ORIGIN_X = 250;
const ORIGIN_Y = 250;

const ARR_X = 25;
const ARR_Y = 12;

const INIT_SCATTER_MULT = 0.0001;

const INIT_THETA_MIN = 0.0;
const INIT_THETA_MAX = 1.0;

const CIRCLE_DIAMETER = 15;
const CIRCLE_RADIUS = CIRCLE_DIAMETER / 2;
const LINE1_LENGTH = 120;
const LINE2_LENGTH = 120;

const MASS1 = 1;
const MASS2 = 1;

const ACCEL_CONST = 0.2;

const SUBSTEP_COUNT = 10;

const GRID_MIDPOINT_X = ORIGIN_X;
const GRID_CELL_WIDTH = CIRCLE_RADIUS;
const GRID_CELL_HEIGHT = CIRCLE_RADIUS;
const GRID_TOP_Y = ORIGIN_Y + LINE1_LENGTH + LINE2_LENGTH + CIRCLE_DIAMETER + GRID_CELL_HEIGHT;
const GRID_BOT_Y = GRID_TOP_Y + ARR_Y * GRID_CELL_HEIGHT;

const RGB_MAX = 255;
const ERR_COLOR = [235, 91, 52];

const DEFAULT_RGB_0 = [251, 239, 244];
const DEFAULT_RGB_T1 = [55, 61, 149];
const DEFAULT_RGB_T2 = [293, 67, 107];
const DEFAULT_RGB_BACKGROUND = [0, 0, 29];

const DEFAULT_DRAW_TRAILS = true;

let color0;
let colorT1;
let colorT2;
let colorBackground;

let pendula;
let colorGrid;

let picker0;
let pickerT1;
let pickerT2;
let pickerBackground;

let checkboxDrawTrails;

function Pendulum(theta1, theta2) {
  this.theta1 = theta1;
  this.theta2 = theta2;

  this.omega1 = 0;
  this.omega2 = 0;

  this.step = function() {
    for (let i = 0; i < SUBSTEP_COUNT; i++)
    {
      this.substep();
    }
  }

  this.substep = function() {
    const delta = this.theta2 - this.theta1;

    // angular velocity change
    const denominator_common = 2 * MASS1 + MASS2 - MASS2 * cos(2 * this.theta1 - 2 * this.theta2);
    const denominator1 = LINE1_LENGTH * denominator_common;
    const denominator2 = LINE2_LENGTH * denominator_common;

    const d_omega1 = (-ACCEL_CONST * (2 * MASS1 + MASS2) * sin(this.theta1) - MASS2 * ACCEL_CONST * sin(this.theta1 - 2 * this.theta2) - 2 * sin(this.theta1 - this.theta2) * MASS2 * (this.omega2 ** 2 * LINE2_LENGTH + this.omega1 ** 2 * LINE1_LENGTH * cos(this.theta1 - this.theta2))) / denominator1;

    const d_omega2 = (2 * sin(this.theta1 - this.theta2) * (this.omega1 ** 2 * LINE1_LENGTH * (MASS1 + MASS2) + ACCEL_CONST * (MASS1 + MASS2) * cos(this.theta1) + this.omega2 ** 2 * LINE2_LENGTH * MASS2 * cos(this.theta1 - this.theta2))) / denominator2;

    this.omega1 += d_omega1 / SUBSTEP_COUNT;
    this.omega2 += d_omega2 / SUBSTEP_COUNT;
    if (isNaN(this.omega1) ||
      isNaN(this.omega2) ||
      abs(this.omega1) > PI ||
      abs(this.omega2) > PI)
    {
      console.log(this);
    }

    this.theta1 += this.omega1 / SUBSTEP_COUNT;
    this.theta2 += this.omega2 / SUBSTEP_COUNT;
    this.theta1 %= TAU;
    this.theta2 %= TAU;
  };

  this.draw = function() {
    const x1 = ORIGIN_X + LINE1_LENGTH * sin(this.theta1);
    const y1 = ORIGIN_Y + LINE1_LENGTH * cos(this.theta1);

    line(ORIGIN_X, ORIGIN_Y, x1, y1);
    ellipse(x1, y1, CIRCLE_DIAMETER, CIRCLE_DIAMETER);

    const x2 = x1 + LINE2_LENGTH * sin(this.theta2);
    const y2 = y1 + LINE2_LENGTH * cos(this.theta2);

    line(x1, y1, x2, y2);
    ellipse(x2, y2, CIRCLE_DIAMETER, CIRCLE_DIAMETER);
  };

  this.getColor = function() {
    if (isNaN(this.theta1) || isNaN(this.theta2))
    {
      return color(...ERR_COLOR);
    }

    const theta1Ratio = sin(this.theta1) ** 2;
    const theta2Ratio = sin(this.theta2) ** 2;
    const theta1Idx = floor(theta1Ratio * (colorGrid.length - 1));
    const theta2Idx = floor(theta2Ratio * (colorGrid[0].length - 1));

    console.assert(theta1Idx >= 0 && theta1Idx < colorGrid.length, this.theta1, theta1Idx);
    console.assert(theta2Idx >= 0 && theta2Idx < colorGrid[0].length, this.theta2, theta2Idx);

    if (undefined === colorGrid[theta1Idx][theta2Idx])
    {
      console.assert(theta1Idx !== 0 && theta2Idx !== 0, theta1Idx, theta2Idx);
      colorGrid[theta1Idx][theta2Idx] = lerpColor(colorGrid[theta1Idx][0], colorGrid[0][theta2Idx], theta2Idx / (theta1Idx + theta2Idx));
    }
    return colorGrid[theta1Idx][theta2Idx];
  }
};

function initPendula() {
  const rootT1 = random([-1, 1]) * random(INIT_THETA_MIN, INIT_THETA_MAX) * PI;
  const rootT2 = random([-1, 1]) * random(INIT_THETA_MIN, INIT_THETA_MAX) * PI;

  console.log("root t1:", rootT1);
  console.log("root t2:", rootT2);

  pendula = Array(ARR_Y).fill().map(
    (o, y) => Array(ARR_X).fill().map(
      (o, x) => {
        const initT1 = rootT1 + (y - ARR_Y / 2) / (0.5 * ARR_Y) * PI * INIT_SCATTER_MULT;
        const initT2 = rootT2 + (x - ARR_X / 2) / (0.5 * ARR_Y) * PI * INIT_SCATTER_MULT;
        return new Pendulum(initT1, initT2);
      }
    )
  );
}

function initColorGrid() {
  colorGrid = Array(RGB_MAX).fill().map((o, y) => Array(RGB_MAX).fill(NaN));

  for (let y = 0; y < colorGrid.length; y++) {
    colorGrid[y][0] = lerpColor(color0, colorT1, y / colorGrid.length);
  }

  for (let x = 0; x < colorGrid[0].length; x++) {
    colorGrid[0][x] = lerpColor(color0, colorT2, x / colorGrid[0].length);
  }

  for (let y = 1; y < colorGrid.length; y++) {
    for (let x = 1; x < colorGrid[0].length; x++) {
      colorGrid[y][x] = undefined;
    }
  }
}

function positionDomElements() {
  picker0.position(0, windowHeight - picker0.height);
  pickerT1.position(picker0.position().x + picker0.width, picker0.position().y);
  pickerT2.position(pickerT1.position().x + pickerT1.width, pickerT1.position().y);
  pickerBackground.position(pickerT2.position().x + pickerT2.width, pickerT2.position().y);
  checkboxDrawTrails.position(pickerBackground.position().x + pickerBackground.width, pickerBackground.position().y);
}

function initColorPickers() {
  picker0 = createColorPicker(color(...DEFAULT_RGB_0));
  pickerT1 = createColorPicker(color(...DEFAULT_RGB_T1));
  pickerT2 = createColorPicker(color(...DEFAULT_RGB_T2));
  pickerBackground = createColorPicker(color(...DEFAULT_RGB_BACKGROUND));
}

function colorsEqual(c1, c2) {
  return red(c1) === red(c2) &&
    green(c1) === green(c2) &&
    blue(c1) === blue(c2) &&
    alpha(c1) === alpha(c2);
}

function updateColors() {
  const newColor0 = picker0.color();
  const newColorT1 = pickerT1.color();
  const newColorT2 = pickerT2.color();
  const newColorBackground = pickerBackground.color();

  const isInit = color0 === undefined;

  if (!isInit &&
    colorsEqual(newColor0, color0) &&
    colorsEqual(newColorT1, colorT1) &&
    colorsEqual(newColorT2, colorT2) &&
    colorsEqual(newColorBackground, colorBackground))
  {
    return;
  }

  color0 = picker0.color();
  colorT1 = pickerT1.color();
  colorT2 = pickerT2.color();
  colorBackground = pickerBackground.color();

  initColorGrid();
  setBackgroundColor();
}

function setBackgroundColor() {
  select("body").style("background-color", colorBackground);
}

function initCheckbox() {
  checkboxDrawTrails = createCheckbox("draw trails", DEFAULT_DRAW_TRAILS);
  checkboxDrawTrails.style("padding:2px");
}

function setup() {
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);

  initCheckbox();
  initColorPickers();
  positionDomElements();
  updateColors();

  initPendula();
  initColorGrid();

  setBackgroundColor();
}

function windowResized() {
  positionDomElements();
}

function showTimeElapsed(start) {
  fill(color(255, 255, 255));
  stroke(colorBackground);
  strokeWeight(5);
  text(`${(millis() - start).toFixed(3)} ms`, 0, 100);
  strokeWeight(1);
}

function draw() {
  // const start = millis();

  if (!checkboxDrawTrails.checked())
  {
    clear();
  }

  updateColors();

  pendula.forEach(
    (arr, y) => arr.forEach(
      (pendulum, x) => {
        const color = pendulum.getColor();
        fill(color);
        stroke(color);

        rect(
          GRID_MIDPOINT_X + (x - (arr.length - 1) / 2) * GRID_CELL_WIDTH,
          GRID_TOP_Y + (y + 1) * GRID_CELL_HEIGHT,
          GRID_CELL_WIDTH,
          GRID_CELL_HEIGHT
        );
        pendulum.draw(ORIGIN_X, ORIGIN_Y);

        pendulum.step();
      }
    )
  );

  // showTimeElapsed(start);
}

/* alt. idea: draw two pendulums and lerp n pendulums between them */
