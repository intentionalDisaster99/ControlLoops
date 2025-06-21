/*

  I am writing this right now to merely be an example PID loop 
  so that I can play with it :D
  
  It will hopefully be a legit PID with everything, just showing a 
  graph of it with respect to time.

*/

// This is our little dodad that is moving
var broskie = {
    pos: 0, vel: 0,
    update: function () {
        this.pos += this.vel * 0.01;
        this.vel *= 0.9
    }
};

// Where we want to go 
const target = 100;

// These are our datapoints as we go along the mission loop
let points = [];

// These will be sliders so that we can change what the thingies are 
// in real time
let pSlider;
let iSlider;
let dSlider;
let noiseSlider;

function setup() {
    createCanvas(400, 400);

    // Updating the global stroke width
    strokeWeight(3);

    // Creating sliders and their text
    let pDiv = createDiv("Proportion").style("color: white");
    pSlider = createSlider(0, 100, 1.3, 0.1);
    let iDiv = createDiv("Integral").style("color: white");
    iSlider = createSlider(0, 0.5, 0, 0);
    let dDiv = createDiv("Derivative").style("color:white");
    dSlider = createSlider(0, 100, 0);
    let nDiv = createDiv("Noise").style("color:white");
    noiseSlider = createSlider(0, 1000, 0);

}

function draw() {

    // Some random noise to make sure it gets adjusted
    broskie.vel += randomGaussian() * noiseSlider.value();

    // Adding in gravity 
    broskie.vel -= 100;

    // Moving down to center the x axis vertically
    translate(0, 200);

    // Resetting the background
    background(0);


    // Drawing the target altitude
    stroke(30, 200, 10);
    beginShape();
    for (let x = 0; x < width; x++) {
        vertex(x, -target);
    }
    endShape();

    // Adding a vertex if we can
    if (width / 2 > points.length) {
        points.push(broskie.pos);

        // Updating the pos
        broskie.update();

        // Updating the velocity of bro
        broskie.vel += PID(broskie.pos);

    } else {

        // Resetting everything 
        broskie.pos = 0;
        broskie.vel = 0;
        points = [];

    }

    // Drawing the verticies that we have 
    stroke(0, 100, 255);
    beginShape();
    noFill();
    for (let x = 0; x < points.length; x++) {
        vertex(x * 2, -points[x]);
    }
    endShape();


}


function PID(pos) {

    // Getting the error
    let error = target - pos;

    // Creating the sum variable and adding on the direct proportion
    let sum = error * pSlider.value();

    // Getting the integration part
    let integration = 0;
    for (let i = 0; i < points.length; i++) {
        integration += target - points[i];
    }
    sum += integration * iSlider.value();

    // Now for the derivative term
    // It's just rise over run, how hard can it be?
    let rise = error - (target - points[points.length - 1]);
    let run = 1; // I guess I didn't really need this

    sum += rise / run * dSlider.value();



    return sum;


}






