// 
// This is a simple demonstration of phase plane control because I saw a graph and it looks cool
// Thanks Drew
// 


// 


// Allows the user to adjust the target throughout the simulation
let targetSlider;
let targetDiv;

// Allows the user to adjust the orientation and velocity for the spinner to fix
let orientationSlider;
let orientationDiv;
let velocitySlider;
let velocityDiv;

// The button that allows the user to restart the simulation with the orientation and velocity they picked out
let button;

// The spinner that will be controlled
let spinner;

// Tells the program whether it should run or not
let running = true;


// Testing
let x = -180;
let lower = [];
let upper = [];

function setup() {

    // Screen wide canvas
    let canvas = createCanvas(windowWidth, windowHeight - 150);
    canvas.position(0, 0);

    init();

}



function draw() {

    background(0);

    // Spinner stuff
    spinner.draw();
    if (running) {
        spinner.fix();
        spinner.update();
    };
    spinner.setTarget(targetSlider.value());


    // Visual stuff
    updateGUI();
    drawGraph();
}

function init() {

    spinner = new Spinner();
    targetDiv = createDiv("Target: 0 deg").style("color: black");
    targetDiv.position(10, height + 10);
    targetSlider = createSlider(-180, 180, 0, 0.1);
    targetSlider.position(10, height + 30);
    orientationDiv = createDiv("Orientation: 0 deg").style("color: black");
    orientationDiv.position(10, height + 50);
    orientationSlider = createSlider(-180, 179, 0, 0.1);
    orientationSlider.position(10, height + 70);
    velocityDiv = createDiv("Velocity: 0 deg/frame").style("color: black");
    velocityDiv.position(10, height + 90);
    velocitySlider = createSlider(-360 / 60, 360 / 60, 0, 0.1);
    velocitySlider.position(10, height + 110);
    button = createButton("Start\nor\nStop");
    button.position(200, height + 10).size(50, 120);
    button.mousePressed(setUserSettings);
}

// Updates the values in the gui
function updateGUI() {
    targetDiv.html("Target: " + targetSlider.value().toFixed(2) + " deg").style("color: black");
    if (running) {

        // Sliders
        orientationDiv.html("Orientation: " + spinner.position.toFixed(2) + " deg").style("color: black");
        velocityDiv.html("Velocity: " + spinner.vel.toFixed(2) + " deg/frame").style("color: black");

        // The start stop button
        button.html("Stop");

    } else {

        // The start stop button
        button.html("Start");

    }
}

// Draws, uhh, the, uhh, graph
function drawGraph() {


    // Calculate what the borders
    lower = [];
    upper = [];
    for (let x = -180; x < 180; x++) {
        lower.push(createVector(x * 1.3, -spinner.phasePlaneLower(x)));
        upper.push(createVector(x * 1.3, -spinner.phasePlaneUpper(x)));
    }

    push();
    translate(width / 2, height / 4 * 3);

    // Draw axis lines
    stroke(255, 50);
    line(0, -180, 0, 180);
    line(-180 * 1.3, 0, 180 * 1.3, 0);

    // Draw the borders
    noFill();
    stroke(255);
    strokeWeight(1);
    beginShape();
    for (let i = 0; i < lower.length; i++) {
        vertex(lower[i].x, lower[i].y);
    }
    endShape();
    beginShape();
    for (let i = 0; i < upper.length; i++) {
        vertex(upper[i].x, upper[i].y);
    }
    endShape();

    // Draw the location of the spinner
    stroke(0, 0, 255);
    strokeWeight(5);
    fill(0, 0, 255)
    point(spinner.position * 1.3, -spinner.vel * 60);

    pop();


}

// Sets the settings to what the user wants them to be 
function setUserSettings() {
    if (running) {
        running = false;
    } else {
        running = true;
        spinner.setVelocity(velocitySlider.value());
        spinner.setPosition(orientationSlider.value());
    }

}


// Simple spinner class
class Spinner {

    // Constructor
    constructor() {

        // Positioning and drawing stuff
        this.target = 0;                // deg
        this.vel = 0;                   // deg/frame
        this.position = 0;              // deg
        this.radius = 250;              // px

        // Controller stuff
        this.deadWidth = 5;             // deg
        this.workingVelocity = 30;      // deg/frame
        this.decreaseSlope = -0.5;      // hz (I think)
        this.thrustValue = 0.01;

    }

    // Functions to set the things
    setVelocity(newVel) {
        this.vel = newVel;
    }
    setPosition(newPos) {
        this.position = newPos;
    }
    setTarget(newTarget) {
        this.target = newTarget;
    }


    // Draws the spinner
    draw() {
        push();

        translate(width / 2, height / 4);

        // Drawing the radius
        strokeWeight(1);
        stroke(255, 0, 0);
        noFill()
        circle(0, 0, this.radius);

        // Drawing a thicker line where the target is
        stroke(0, 255, 0);
        strokeWeight(10);
        let x = cos(radians(this.target)) * this.radius / 2;
        let y = sin(radians(this.target)) * this.radius / 2;
        line(x * 0.9, y * 0.9, x, y);
        line(-x * 0.9, -y * 0.9, -x, -y);


        // Drawing the current location
        strokeWeight(1);
        stroke(255);
        x = cos(radians(this.position)) * this.radius / 2;
        y = sin(radians(this.position)) * this.radius / 2;
        line(-x, -y, x, y);

        pop()
    }

    // Moves the spinner
    update() {
        this.position = (this.position + 180 * 9) % 360 - 180;
        this.position += this.vel;
        this.position = (this.position + 180 * 9) % 360 - 180;
    }

    // Fixes the orientation with the phase plane controller
    fix() {
        this.vel += this.phasePlane() * this.thrustValue;
    }


    // The actual controller
    phasePlane() {

        if (this.vel * 60 < this.phasePlaneUpper(this.position) && this.vel * 60 > this.phasePlaneLower(this.position)) {
            return 0;
        }
        if (this.vel * 60 > this.phasePlaneUpper(this.position)) {
            return -1;
        }
        if (this.vel * 60 < this.phasePlaneLower(this.position)) {
            return 1;
        }

    }

    // Internal function that returns the upper y value for an x value in the phase plane
    phasePlaneUpper(x) {
        x = ((x - this.target) + 180 * 3) % 360 - 180;
        return abs(this.workingVelocity) < abs(this.decreaseSlope * x) ? this.workingVelocity * (-x / abs(x)) + this.deadWidth / 2 : this.decreaseSlope * x + this.deadWidth / 2;
    }
    // Internal function that returns the lower y value for an x value in the phase plane
    phasePlaneLower(x) {
        x = ((x - this.target) + 180 * 3) % 360 - 180;
        return abs(this.workingVelocity) < abs(this.decreaseSlope * x) ? this.workingVelocity * (-x / abs(x)) - this.deadWidth / 2 : this.decreaseSlope * x - this.deadWidth / 2;
    }

}