
// Constants
const SCALE = 10;
const TIME_STEP = 1 / 60;
const MAX_WHEEL_SPEED = 5.0;
let cubesat;
let prevMousePosition = { x: null, y: null };

// For the phase control specifically
let POSITIONAL_TOLERANCE = 0.01; // This is 1 cm
let VELOCITY_TOLERANCE = 0.25;   // This is 1 cm / s
let UPDATE_AMOUNT = 0.1; // The amount added when activated


// NOTES:
//        For this project, I will be using RPY for the order of Roll Pitch Yaw

function setup() {

    // Creating a 3D canvas to draw on
    let canvas = createCanvas(windowWidth, windowHeight, WEBGL);
    canvas.position(0, 0);

    // Setting up our cubesat
    cubesat = new Cubesat(3);

    // Making the camera look nice
    camera(400, -400, 400, 0, 0, 0, 0, 1, 0);


}

function draw() {

    // Background and lighting
    background(0);
    let c = color(255, 255, 255);
    pointLight(c, 0, -400, 0);
    ambientLight(220);

    // Updating and drawing
    cubesat.update();
    cubesat.draw();


}

// Update the cubesat's orientation based on mouse dragging 
function mouseDragged() {

    if (prevMousePosition.x == null || prevMousePosition.y == null) {
        prevMousePosition.x = mouseX;
        prevMousePosition.y = mouseY;
        return;
    }

    let dx = mouseX - prevMousePosition.x;
    let dy = mouseY - prevMousePosition.y;
    let sensitivity = 0.001;
    let axis = createVector(dy * sensitivity, dx * sensitivity, 0);
    let angle = axis.mag();
    let newAngularVel = Quat.fromAxisAngle(axis.normalize(), angle * 5);
    cubesat.addAlpha(newAngularVel);
    prevMousePosition.x = mouseX;
    prevMousePosition.y = mouseY;

}

// This is the cubesat class that we will use
// it only has 3U and1U because those are the ones we will be working on
class Cubesat {

    // We want a size
    width; height; depth;

    // We want an orientation
    orient;

    // The angular velocity of the cubesat
    angularVel;

    // The mass
    mass;

    // We also need reaction wheels 
    xWheel;
    yWheel;
    zWheel;

    // The constructor
    constructor(size) {

        // Defaulting to the big one
        this.width = 10;
        this.depth = 10;
        this.height = 30;

        // Correcting if they want the small one
        if (size == 1) {
            this.height = 10;
        }

        // Defaulting the orientation to being upright
        this.orient = createVector(1, 0, 0);

        // The velocity starts at zero
        this.angularVel = createVector(0, 0, 0);

        // Making the wheels
        this.xWheel = new ReactionWheel(0.5, 10);
        this.yWheel = new ReactionWheel(0.5, 10);
        this.zWheel = new ReactionWheel(0.5, 10);


        // Finding the mass
        this.mass = 3;

        this.updateMomentOfInertia();

    }


    // To actually show it 
    draw() {

        // We are going to need to rotate the actual screen to draw the box the right way
        push();



        // Rotating for the roll 
        rotate(this.orient.x, [1, 0, 0]);
        rotate(this.orient.y, [0, 1, 0]);
        rotate(this.orient.z, [0, 0, 1]);

        // Making the box 
        fill(75);
        strokeWeight(3);
        box(this.height * SCALE, this.width * SCALE, this.depth * SCALE);

        pop();

        /*
        
                // Drawing the top wheel
                push();
        
                // Aligning with the box
                rotate(angle, [x, y, z]);
        
                // Translating to match up with the side of the box
                translate(0, (this.depth * SCALE) / 2 + 1, 0);
        
                // Drawing
                this.zWheel.draw();
        
                pop();
        
                // Drawing the left wheel
                push();
        
                // Aligning with the box
                rotate(angle, [x, y, z]);
        
                // Rotating to be aligned with the face on the side of the box
                rotate(PI / 2, [1, 0, 0]);
        
                // Translating to match up with the side of the box
                translate(0, (this.width * SCALE) / 2 + 1, 0);
        
                // Drawing 
                this.yWheel.draw();
        
                pop();
        
                // Drawing the right wheel
                push();
        
                // Aligning with the box
                rotate(angle, [x, y, z]);
        
                // Rotating to be aligned with the face on the side of the box
                rotate(PI / 2, [0, 0, 1]);
        
                // Translating to match up with the side of the box
                translate(0, (this.height * SCALE) / 2 + 1, 0);
        
                // Drawing
                this.xWheel.draw();
        
                pop();
        
        
        */
    }

    update() {

        // Apply phase control when the mouse is not being dragged
        if (!mouseIsPressed && !keyIsDown(32)) {
            this.phaseControl(new Quat(1, 0, 0, 1).normalize());
        }

        // Moving each of the wheels
        this.xWheel.update();
        this.yWheel.update();
        this.zWheel.update();

        // The change that we need to add in
        let velocityChange = fromRollPitchYaw(Quat.scalarMult(this.angularVel, TIME_STEP));

        // Updating the orientation 
        this.orient = fromQuaternion(Quat.sonOfAWhoreMult(this.orient, velocityChange).normalize());

    }




    // PHASE PLANE CONTROL
    phaseControlOld(target) {

        // ! I have been reading the angles wrong :O
        // I need to adjust because the quaternions aren't just direct relations to the roll, pitch, and yaw
        // They are q = { r: cos(theta/2), Ux sine(theta/2), Uy sine(theta/2), Uz sine(theta/2)}
        //          Where theta is the angle of rotation

        // We can convert these to roll, pitch, and yaw pretty easily though, with some simple equations
        // Roll (phi) = atan2(2(r*i + j*k), 1-2(i^2 + j^2))
        // Pitch (theta) = arcsin(2(rj + ik))
        // Yaw (psi) = atan2(2(r*k + j*i), 1-2(k^2 + j^2))

        // Now I just need to figure out how to code atan2,
        // which just finds an angle between the positive x axis and the point
        // Basically, I need to convert to polar and go ham
        // Interestingly, p5 already has a atan2 function

        // Getting the orientation
        let roll = atan2(2 * (this.orient.r * this.orient.i + this.orient.j * this.orient.k), 1 - 2 * (this.orient.i * this.orient.i + this.orient.j * this.orient.j));
        let pitch = asin(2 * (this.orient.r * this.orient.j + this.orient.i * this.orient.k));
        let yaw = atan2(2 * (this.orient.r * this.orient.k + this.orient.j * this.orient.i), 1 - 2 * (this.orient.k * this.orient.k + this.orient.j * this.orient.j));
        let eulerOrientation = createVector(roll, pitch, yaw);

        // The error in each axis
        let eulerError = createVector(target.x - eulerOrientation.x, target.y - eulerOrientation.y, target.z - eulerOrientation.z);

        // Getting the angular velocity
        roll = atan2(2 * (this.orient.r * this.orient.i + this.orient.j * this.orient.k), 1 - 2 * (this.orient.i * this.orient.i + this.orient.j * this.orient.j));
        pitch = asin(2 * (this.orient.r * this.orient.j + this.orient.i * this.orient.k));
        yaw = atan2(2 * (this.orient.r * this.orient.k + this.orient.j * this.orient.i), 1 - 2 * (this.orient.k * this.orient.k + this.orient.j * this.orient.j));
        let eulerVelocity = createVector(roll, pitch, yaw);

        // The force that we will apply in each axis
        let force = createVector(0, 0, 0);


        // X (roll)
        if (eulerError.x > POSITIONAL_TOLERANCE) {
            // Only adding it if it isn't moving in the right direction already
            if (this.eulerVelocity.x + VELOCITY_TOLERANCE > 0) {
                force.x = UPDATE_AMOUNT;
            }
        } else if (eulerError.x < -POSITIONAL_TOLERANCE) {
            // Only adding it if it isn't moving in the right direction already
            if (eulerVelocity.x - VELOCITY_TOLERANCE < 0) {
                force.x = -UPDATE_AMOUNT;
            }
        } else {
            if (abs(eulerVelocity.x) > VELOCITY_TOLERANCE) {
                if (eulerVelocity.x - VELOCITY_TOLERANCE < 0) {
                    force.x = -UPDATE_AMOUNT;
                } else {
                    force.x = UPDATE_AMOUNT;
                }
            } else {
                force.x = 0;
            }
        }

        // Finding the angular momentum in the x axis
        let angularMomentumX = this.momentX * eulerVelocity.x + this.xWheel.vel * this.xWheel.MOI;

        // Updating the wheel's  velocity
        this.xWheel.vel += force.x;

        // Now the angular vel will be ( L0 - Lwheel ) / MOIcubesat
        this.angularVel.i = (angularMomentumX - this.xWheel.vel * this.xWheel.MOI) / this.momentX;

    }

    phaseControl(target) {

        // Converting the target to roll pitch and yaw
        target = fromQuaternion(target);

        // Converting from euler angles to a quaternion
        let targetQuat = fromRollPitchYaw(target.x, target.y, target.z);

        // Converting back from a quaternion to euler angles
        let eulerVelocity = this.angularVel;

        // The formula for the error quat is desired * currentInverse
        let currentInverse = Quat.inversify(fromRollPitchYaw(this.orient));
        let errorQuat = Quat.sonOfAWhoreMult(targetQuat, currentInverse);

        // Now the vector part of the error represents the axis of misalignment and the real, the magnitude(total not for each part)
        // So we can just use the vector parts to turn on or off each axis

        // The forces put on each wheel
        let force = createVector(0, 0, 0);

        // Fixing everything
        force.x = this.fix(errorQuat.i, eulerVelocity.x);
        force.y = this.fix(errorQuat.j, eulerVelocity.y);
        force.z = this.fix(errorQuat.k, eulerVelocity.z);


        // Finding the angular momentum in the x axis
        let angularMomentumX = this.momentX * eulerVelocity.x + this.xWheel.vel * this.xWheel.MOI;

        // Updating the wheel's  velocity
        this.xWheel.vel += force.x;

        // Now the angular vel will be ( L0 - Lwheel ) / MOIcubesat
        let newXVelocity = (angularMomentumX - this.xWheel.vel * this.xWheel.MOI) / this.momentX;

        // Finding the angular momentum in the y axis
        let angularMomentumY = this.momentY * eulerVelocity.y + this.yWheel.vel * this.yWheel.MOI;

        // Updating the wheel's  velocity
        this.yWheel.vel += force.y;

        // Now the angular vel will be ( L0 - Lwheel ) / MOIcubesat
        let newYVelocity = (angularMomentumY - this.yWheel.vel * this.yWheel.MOI) / this.momentY;

        // Finding the angular momentum in the y axis
        let angularMomentumZ = this.momentZ * eulerVelocity.z + this.zWheel.vel * this.zWheel.MOI;

        // Updating the wheel's  velocity
        this.zWheel.vel += force.x;

        // Now the angular vel will be ( L0 - Lwheel ) / MOIcubesat
        let newZVelocity = (angularMomentumZ - this.zWheel.vel * this.zWheel.MOI) / this.momentZ;

        // Updating the angular velocity to match the math
        this.angularVel = createVector(newXVelocity, newYVelocity, newZVelocity);


    }

    // To fix something in the phase controller
    fix(error, velocity) {

        if (error > POSITIONAL_TOLERANCE) {
            // Only adding it if it isn't moving in the right direction already
            // if (velocity + VELOCITY_TOLERANCE > 0) {
            // return UPDATE_AMOUNT;
            // }
            return 0.1 * error;
        } else if (error < -POSITIONAL_TOLERANCE) {
            // Only adding it if it isn't moving in the right direction already
            // if (velocity - VELOCITY_TOLERANCE < 0) {
            // return -UPDATE_AMOUNT;
            // }
            return -0.1 * error;
        }// else {
        //     // Making sure that it settles down to zero if it is in the right place
        //     if (abs(velocity) > VELOCITY_TOLERANCE) {
        //         if (velocity - VELOCITY_TOLERANCE < 0) {
        //             return -UPDATE_AMOUNT;
        //         } else {
        //             return UPDATE_AMOUNT;
        //         }
        //     } else {
        //         return 0;
        //     }
        // }
        return 0;

    }


    // Adding angular acceleration (alpha) to allow mouse control
    addAlpha(alpha) {
        this.angularVel = fromQuaternion(Quat.add(fromRollPitchYaw(this.angularVel), alpha));
    }


    // A localized way to recalculate the moment of inertias 
    updateMomentOfInertia() {
        // Calculate moments of inertia for the main body
        this.momentX = (1 / 12) * this.mass * (this.width * this.width + this.height * this.height);
        this.momentY = (1 / 12) * this.mass * (this.height * this.height + this.depth * this.depth);
        this.momentZ = (1 / 12) * this.mass * (this.width * this.width + this.depth * this.depth);

        // Reaction wheel moment of inertia (assuming cylindrical wheels)
        this.wheelMass = 0.77935;  // kg
        this.wheelRadius = 15;     // mm
        this.wheelMoment = (1 / 2) * this.wheelMass * (this.wheelRadius * this.wheelRadius);
    }

}

class ReactionWheel {

    // The mass of the wheel
    mass;

    // The radius
    radius;

    // The calculated moment of inertial of this wheel
    MOI;

    // The position of the wheel
    pos;

    // The velocity of the wheel
    vel;

    constructor(mass, radius) {

        this.mass = mass;
        this.radius = radius;

        // The moment of inertia for a solid disk is 1/2 mr^2
        this.MOI = 0.5 * mass * this.radius * this.radius;

        // Setting the position and velocity to zero
        this.vel = 0;
        this.pos = 0;

    }

    // To make it move
    update() {

        // Constraining the velocity as if it was like a motor all the way on or off
        this.vel = constrain(this.vel, -10, 10);

        this.pos += this.vel * TIME_STEP;

        // ? Should I add in friction here? 

    }

    // Drawing it 
    draw() {

        // We are assuming it is already in the right position

        // Telling it to to the angle it needed
        rotate(this.pos, [0, 1, 0]);

        // The actual drawing of the disk
        cylinder(30, 10, 10, 2);

    }



}



// This is a simple class for a Quaternion
class Quat {

    // By parts lol
    r; i; j; k;

    constructor(r, i, j, k) {
        this.r = r;
        this.i = i;
        this.j = j;
        this.k = k;
    }

    // A sorta constructor that returns a new one from a vector3
    static fromVector(vec) {
        return new Quat(0, vec.x, vec.y, vec.z);
    }

    // Adding is really simple. All you have to do is add the components
    static add(one, two) {
        return new Quat(one.r + two.r, one.i + two.i, one.j + two.j, one.k + two.k);
    }

    // Subtracting is also really simple. All you have to do is add the components
    static sub(one, two) {
        return new Quat(one.r - two.r, one.i - two.i, one.j - two.j, one.k - two.k);
    }

    // Multiplying is a bit harder, so I'll add two functions for it
    static scalarMult(one, scalar) {
        return new Quat(one.r, one.i * scalar, one.j * scalar, one.k * scalar);
    }

    // The more complex Quaternion multiplication
    static sonOfAWhoreMult(q1, q2) {

        let r = q1.r * q2.r - q1.i * q2.i - q1.j * q2.j - q1.k * q2.k;
        let i = q1.r * q2.i + q1.i * q2.r + q1.j * q2.k - q1.k * q2.j;
        let j = q1.r * q2.j - q1.i * q2.k + q1.j * q2.r + q1.k * q2.i;
        let k = q1.r * q2.k + q1.i * q2.j - q1.j * q2.i + q1.k * q2.r;

        return new Quat(r, i, j, k);

    }

    static getConjugate(Quaternion) {
        return new Quat(Quaternion.r, -Quaternion.i, -Quaternion.j, -Quaternion.k);
    }

    normalize() {

        // Finding the magnitude 
        let mag = Math.sqrt((this.r * this.r + this.i * this.i + this.j * this.j + this.k * this.k));

        // Dividing all of the parts by the magnitude

        if (mag != 0) {
            this.r /= mag;
            this.i /= mag;
            this.j /= mag;
            this.k /= mag;
        } else {

            // If it is zero then we want to return a unit quat
            return new Quat(1, 0, 0, 0);

        }

        return this;

    }


    static fromAxisAngle(axis, angle) {
        let halfAngle = angle / 2;
        let s = sin(halfAngle);
        return new Quat(cos(halfAngle), axis.x * s, axis.y * s, axis.z * s);
    }

    // Generates the inverse of the inputted quaternion
    static inversify(q) {
        return new Quat(q.r, -q.i, -q.j, -q.k);
    }

}


// This returns a new quaternion that represents the inputted Euler angles (found using Wikipedia)
function fromRollPitchYaw(roll, pitch, yaw) {

    let cr = cos(roll * 0.5);
    let sr = sin(roll * 0.5);
    let cp = cos(pitch * 0.5);
    let sp = sin(pitch * 0.5);
    let cy = cos(yaw * 0.5);
    let sy = sin(yaw * 0.5);

    let q = new Quat(0, 0, 0, 0);
    q.r = cr * cp * cy + sr * sp * sy;
    q.i = sr * cp * cy - cr * sp * sy;
    q.j = cr * sp * cy + sr * cp * sy;
    q.k = cr * cp * sy - sr * sp * cy;

    return q;
}
// The same as above but with a vector as the input instead of three components
function fromRollPitchYaw(vector) {

    let roll = vector.x;
    let pitch = vector.y;
    let yaw = vector.z;

    let cr = cos(roll * 0.5);
    let sr = sin(roll * 0.5);
    let cp = cos(pitch * 0.5);
    let sp = sin(pitch * 0.5);
    let cy = cos(yaw * 0.5);
    let sy = sin(yaw * 0.5);

    let q = new Quat(0, 0, 0, 0);
    q.r = cr * cp * cy + sr * sp * sy;
    q.i = sr * cp * cy - cr * sp * sy;
    q.j = cr * sp * cy + sr * cp * sy;
    q.k = cr * cp * sy - sr * sp * cy;

    return q;
}

// Returns the Euler angles for the quaternion
function fromQuaternion(q) {
    let roll = atan2(2 * (q.r * q.i + q.j * q.k), 1 - 2 * (q.i * q.i + q.j * q.j));
    let pitch = asin(2 * (q.r * q.j + q.i * q.k));
    let yaw = atan2(2 * (q.r * q.k + q.j * q.i), 1 - 2 * (q.k * q.k + q.j * q.j));
    return createVector(roll, pitch, yaw);
}