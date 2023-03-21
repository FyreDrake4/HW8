let spriteSheetFilenames = ["AmongUs2.png", "Bug_To_Squish.png"];
let spriteSheets = [];
let animations = [];
let amongUsSprite;
let forestbackground;
let level2 = 0;
let level3 = 0;

let sounds = new Tone.Players({
    error: "assets/error.wav",
    squish: "assets/squish.wav",
});

let synth = new Tone.PolySynth().toDestination();
let dSynth = new Tone.PolySynth();

let lowPass = new Tone.Filter(800, "lowpass").toDestination();

dSynth.connect(lowPass);

const melody = new Tone.Sequence(
    (time, note) => {
        synth.triggerAttackRelease(note, 0.15, time);
        // subdivisions are given as subarrays
    },
    [
        "C4",
        "D4",
        ["F4", "G4", "G#4"],
        "G4",
        "F4",
        "C4",
        "D4",
        ["F4", "G4", "G#4"],
        "A#4",
        "A#4",
        "F4",
        "D#4",
    ]
);

const gameovermelody = new Tone.Sequence(
    (time, note) => {
        synth.triggerAttackRelease(note, 0.15, time);
        // subdivisions are given as subarrays
    },
    ["F3", "F#3", "G#3", "B3", null, "A#3", "A#3", "F#3", "D#3"]
);

const startmelody = new Tone.Sequence(
    (time, note) => {
        synth.triggerAttackRelease(note, 0.15, time);
        // subdivisions are given as subarrays
    },
    [
        "C#5",
        "D#5",
        "F#5",
        "F5",
        "D#5",
        "C#5",
        "F#5",
        null,
        "C#5",
        "D#5",
        "F#5",
        "F5",
        "D#5",
        "C#5",
        "A#5",
        null,
    ]
);

const GameState = {
    Start: "Start",
    Playing: "Playing",
    GameOver: "GameOver",
};

let game = {
    score: 0,
    maxScore: 0,
    maxTime: 30,
    elapsedTime: 0,
    totalSprites: 40,
    amongUsSprites: 5,
    state: GameState.Start,
    targetSprite: 1,
    squished: 0,
};

function preload() {
    for (let i = 0; i < spriteSheetFilenames.length; i++) {
        spriteSheets[i] = loadImage("assets/" + spriteSheetFilenames[i]);
    }
    forestbackground = loadImage("assets/forest.jpg");
}

function setup() {
    sounds.toDestination();
    synth.volume.value = -2;
    dSynth.volume.value = -5;
    createCanvas(800, 600);
    imageMode(CENTER);
    angleMode(DEGREES);
    Tone.Transport.bpm.value = 80;

    reset();
}

function reset() {
    game.elapsedTime = 0;
    game.score = 0;
    game.totalSprites = random(30, 40);
    game.amongUsSprites = random(5, 8);
    game.squished = 0;
    Tone.Transport.bpm.value = 80;
    level2 = level3 = 0;
    gameovermelody.stop("0");

    animations = [];
    let i = 0;
    for (i; i < game.totalSprites; i++) {
        animations[i] = new WalkingAnimation(
            spriteSheets[1],
            32,
            32,
            random(100, 700),
            random(100, 500),
            4,
            random(1, 2),
            6,
            random([0, 1]),
            0,
            0,
            3
        );
    }

    for (let k = 0; k < game.amongUsSprites; k++) {
        animations[i + k] = new WalkingAnimation(
            spriteSheets[0],
            128,
            128,
            random(100, 700),
            random(100, 500),
            8,
            random(1, 1.5),
            6,
            (vertical = 0),
            128,
            0,
            1
        );
    }
}

function draw() {
    switch (game.state) {
        case GameState.Playing:
            startmelody.stop("0");
            melody.start("0");
            image(forestbackground, 400, 300);

            for (let i = 0; i < animations.length; i++) {
                animations[i].draw();
            }
            fill(255);
            textSize(40);
            text("Score: " + game.score, 80, 40);
            if (game.squished > 10 && level2 == 0) {
                Tone.Transport.bpm.value = 110;
                level2 = 1;
            }
            if (game.squished > 20 && level3 == 0) {
                Tone.Transport.bpm.value = 140;
                level3 = 1;
            }

            let currentTime = game.maxTime - game.elapsedTime;
            text("Time: " + ceil(currentTime), 700, 40);
            game.elapsedTime += deltaTime / 1000;

            if (currentTime < 0) game.state = GameState.GameOver;
            break;
        case GameState.GameOver:
            game.maxScore = max(game.score, game.maxScore);

            background(0);
            fill(255);
            melody.stop("0");
            Tone.Transport.bpm.value = 100;
            gameovermelody.start("0");
            textSize(40);
            textAlign(CENTER);
            text("Game Over!", 400, 300);
            textSize(35);
            text("Score: " + game.score, 400, 370);
            text("Max Score: " + game.maxScore, 400, 420);
            text("Press Any Key to Restart", 400, 470);
            break;
        case GameState.Start:
            background(0);
            fill(255);
            Tone.start();
            startmelody.start("0");
            Tone.Transport.start();
            textSize(50);
            textAlign(CENTER);
            text("Bug Squish Game", 400, 300);
            textSize(30);
            text("Press Any Key to Start", 400, 370);
            textSize(25);
            text("Avoid the Imposter!", 400, 420);
            break;
    }
}

function keyPressed() {
    switch (game.state) {
        case GameState.Start:
            game.state = GameState.Playing;
            break;
        case GameState.GameOver:
            reset();
            game.state = GameState.Playing;
            break;
    }
}

function mousePressed() {
    switch (game.state) {
        case GameState.Playing:
            for (let i = 0; i < animations.length; i++) {
                let contains = animations[i].contains(mouseX, mouseY);
                if (contains) {
                    if (animations[i].moving != 0) {
                        animations[i].stop();
                        if (
                            animations[i].spritesheet ===
                            spriteSheets[game.targetSprite]
                        ) {
                            game.score += 1;
                            sounds.player("squish").start();
                        } else {
                            game.score -= 1;
                            sounds.player("error").start();
                        }
                    } else {
                        if (animations[i].xDirection === 1)
                            animations[i].moveRight();
                        else animations[i].moveLeft();
                    }
                }
            }
            break;
    }
}

class WalkingAnimation {
    constructor(
        spritesheet,
        sw,
        sh,
        dx,
        dy,
        animationLength,
        speed,
        framerate,
        vertical = false,
        offsetX = 0,
        offsetY = 0,
        scaling = 1
    ) {
        this.spritesheet = spritesheet;
        this.sw = sw;
        this.sh = sh;
        this.dx = dx;
        this.dy = dy;
        this.u = 0;
        this.v = 0;
        this.animationLength = animationLength;
        this.currentFrame = 0;
        this.moving = 1;
        this.xDirection = 1;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.speed = speed;
        this.framerate = framerate * speed;
        this.vertical = vertical;
        this.scaling = scaling;
        this.dead = 0;
    }

    draw() {
        this.u =
            this.moving != 0
                ? this.currentFrame % this.animationLength
                : this.u;
        push();
        translate(this.dx, this.dy);
        if (this.vertical) rotate(90);
        scale(this.xDirection * this.scaling, this.scaling);

        //rect(-26,-35,50,70);

        image(
            this.spritesheet,
            0,
            0,
            this.sw,
            this.sh,
            this.u * this.sw + this.offsetX,
            this.v * this.sh + this.offsetY,
            this.sw,
            this.sh
        );
        pop();
        let proportionalFramerate = round(frameRate() / this.framerate);
        if (frameCount % proportionalFramerate == 0) {
            this.currentFrame++;
        }

        if (this.vertical) {
            this.dy += this.moving * this.speed * (game.squished * 0.18 + 1);
            this.move(this.dy, this.sw, height - this.sw);
        } else {
            this.dx += this.moving * this.speed * (game.squished * 0.18 + 1);
            if (this.spritesheet === spriteSheets[0]) {
                this.move(this.dx, this.sw - 80, width - this.sw + 80);
            } else {
                this.move(this.dx, this.sw, width - this.sw);
            }
        }
    }

    move(position, lowerBounds, upperBounds) {
        if (position > upperBounds) {
            this.moveLeft();
        } else if (position < lowerBounds) {
            this.moveRight();
        }
    }

    moveRight() {
        this.moving = 1;
        this.xDirection = 1;
        this.v = 0;
    }

    moveLeft() {
        this.moving = -1;
        this.xDirection = -1;
        this.v = 0;
    }

    keyPressed(right, left) {
        if (keyCode === right) {
            this.currentFrame = 1;
        } else if (keyCode === left) {
            this.currentFrame = 1;
        }
    }

    keyReleased(right, left) {
        if (keyCode === right || keyCode === left) {
            this.moving = 0;
        }
    }

    contains(x, y) {
        //rect(-26,-35,50,70);
        if (this.dead) {
            return 0;
        }
        let insideX = x >= this.dx - 26 && x <= this.dx + 25;
        let insideY = y >= this.dy - 35 && y <= this.dy + 35;
        return insideX && insideY;
    }

    stop() {
        this.moving = 0;
        game.squished++;
        this.dead = 1;
        if (this.spritesheet === spriteSheets[0]) {
            this.u = 1;
            this.v = 1;
        } else if (this.spritesheet === spriteSheets[1]) {
            this.u = 4;
            this.v = 0;
        }
    }
}
