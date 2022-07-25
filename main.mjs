import { getDatabase, ref, set, onValue, update, remove }
from "https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js";

const firebaseConfig = {
    apiKey: "AIzaSyDFmXn_JMPKDgu_ELDGUkEfqhkWmY3eCqM",
    authDomain: "auth-e64cd.firebaseapp.com",
    databaseURL: "https://auth-e64cd-default-rtdb.firebaseio.com",
    projectId: "auth-e64cd",
    storageBucket: "auth-e64cd.appspot.com",
    messagingSenderId: "907300081039",
    appId: "1:907300081039:web:2e1623c9b3b8a9cc728ffa",
    measurementId: "G-DH0175KZF1"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase();

var camera = undefined,
    flagimag,
    scene = undefined,
    renderer = undefined,
    light = undefined,
    mouseX = undefined,
    mouseY = undefined,
    maze = undefined,
    mazeMesh = undefined,
    mazeDimension = 11,
    coinMesh = undefined,
    planeMesh = undefined,
    ballMesh = undefined,
    destroyerMesh = undefined,
    collisioneffect = undefined,
    coineffect = undefined,
    flagimg = undefined,
    coinRadius = 0.25,
    ballRadius = 0.25,
    keyAxis = [0, 0],
    ironTexture = THREE.ImageUtils.loadTexture('/ball.png'),
    planeTexture = THREE.ImageUtils.loadTexture('/concrete.png'),
    brickTexture = THREE.ImageUtils.loadTexture('/brick.png'),
    flagTexture = THREE.ImageUtils.loadTexture('images/end-flag.png'),
    shieldTexture = THREE.ImageUtils.loadTexture('images/shi.png'),
    coinTexture = THREE.ImageUtils.loadTexture('images/coin.png'),
    obstacleTexture = THREE.ImageUtils.loadTexture('images/destroyer.PNG'),
    gameState = undefined,
    destroyflag,
    obstacleFlag = false,
    destroyerPath = [],
    noofDestroyer = undefined,
    shieldArray = [],
    noofShield = undefined,
    phyPath = undefined,
    obsatacle,
    levelscore,
    scores = 0,
    level = 0,

    isLocked = false,
    hit = 0,
    clock = undefined,
    allUsersData = [];
let userData;


// Box2D shortcuts
var b2World = Box2D.Dynamics.b2World,
    b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
    b2BodyDef = Box2D.Dynamics.b2BodyDef,
    b2Body = Box2D.Dynamics.b2Body,
    b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
    b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
    b2Settings = Box2D.Common.b2Settings,
    b2Vec2 = Box2D.Common.Math.b2Vec2,

    // Box2D world variables 
    wWorld = undefined,
    wBall = undefined,
    obs = undefined,
    cBall = undefined,
    dball = undefined;

var coins = [];
var shield = [];
var sound = document.createElement('audio');

var gameOver = false;


function createPhysicsWorld() {
    // Create the world object.
    wWorld = new b2World(new b2Vec2(0, 0), true);

    // Create the ball.
    var bodyDef = new b2BodyDef();

    if (!gameOver) {
        bodyDef.type = b2Body.b2_dynamicBody;
    } else if (gameOver) {
        bodyDef.type = b2Body.b2_staticcBody;
    }
    bodyDef.position.Set(1, 1);
    wBall = wWorld.CreateBody(bodyDef);
    var fixDef = new b2FixtureDef();
    fixDef.density = 1.0;
    fixDef.userData = "ball";
    fixDef.friction = 0.0;
    fixDef.restitution = 0.25;
    fixDef.shape = new b2CircleShape(ballRadius);
    wBall.CreateFixture(fixDef);


    //create the obstacle
    var levelCopy = (level + 1) * 2;
    var count = levelCopy;
    console.log(count)

    bodyDef.type = b2Body.b2_staticBody;
    fixDef.shape = new b2PolygonShape();
    fixDef.shape.SetAsBox(0.5, 0.5);
    fixDef.userData = "obstacle"
    for (var i = 1; i < count; i++) {
        for (var j = 0; j < maze.dimension; j++) {
            if (maze[i][j]) {
                bodyDef.position.x = i;
                bodyDef.position.y = j;
                wWorld.CreateBody(bodyDef).CreateFixture(fixDef);
            }

        }
    }


    // Create the maze.
    bodyDef.type = b2Body.b2_staticBody;
    fixDef.shape = new b2PolygonShape();
    fixDef.shape.SetAsBox(0.5, 0.5);
    fixDef.userData = 'wall'
    for (var i = 0; i < maze.dimension; i++) {
        for (var j = 0; j < maze.dimension; j++) {
            if (maze[i][j]) {
                bodyDef.position.x = i;
                bodyDef.position.y = j;
                wWorld.CreateBody(bodyDef).CreateFixture(fixDef);
            }

        }
    }


}
const animAudio = (audiolink) => {
    const audio = new Audio(audiolink);
    audio.play()
};

function generate_maze_mesh(field) {
    var dummy = new THREE.Geometry();
    for (var i = 0; i < field.dimension; i++) {
        for (var j = 0; j < field.dimension; j++) {
            if (field[i][j]) {
                var geometry = new THREE.CubeGeometry(1, 1, 1, 1, 1, 1);
                var mesh_ij = new THREE.Mesh(geometry);
                mesh_ij.position.x = i;
                mesh_ij.position.y = j;
                mesh_ij.position.z = 0.5;
                THREE.GeometryUtils.merge(dummy, mesh_ij);

            }
        }
    }
    var material = new THREE.MeshPhongMaterial({
        map: brickTexture
    });
    var mesh = new THREE.Mesh(dummy, material)
    return mesh;
}



//-----------------Place a coin to maze path-----------------------------
var pathX = [],
    pathY = [],
    coinAnimate = [];

function generate_coin_mesh(field) {
    var dummy = new THREE.Geometry();
    let material = new THREE.MeshLambertMaterial({ map: coinTexture });
    for (var i = 1; i < field.dimension; i++) {
        for (var j = 1 + 1; j < field.dimension; j++) {
            if (!field[i][j]) {
                var rotate = 0.0;
                var increment = 100;
                const geometry = new THREE.CylinderGeometry(0.2, 0.2, 0.03, 100);
                let cube = new THREE.Mesh(geometry, material);
                cube.position.x = i;
                cube.position.y = j;
                cube.position.z = 0.5;
                cube.rotation.y = 0;
                cube.rotation.z = 0;
                if (!gameOver) {
                    setInterval(() => {
                        cube.rotation.x = rotate += 0.01;
                    }, increment);
                }

                // cube.userData = `${i}${j}`;
                coins.push(cube);
                scene.add(cube);
                coinAnimate.push(cube)
                pathX.push(i);
                pathY.push(j)
            }

        }
    }
    var coinmaterial = new THREE.Mesh(dummy, material)
    return coinmaterial;
}

//---------------------------create sheild---------------------------------------------
var shieldPoseX = [],
    shieldPoseY = [],
    shield = [];

function generate_Shield_mesh(field) {
    var dummy = new THREE.Geometry();
    let material = new THREE.MeshLambertMaterial({ map: shieldTexture });
    var levelCopy = level + 1;
    var count = levelCopy;
    console.log(count)
    for (let i = 0; i < count; i++) {



        var index = Math.floor(Math.random() * pathX.length)



        var rotate = 0;
        //if (!field[poseX][poseY]) {
        const geometry = new THREE.SphereGeometry(0.3, 0.3, 0.03, 100);
        let cube = new THREE.Mesh(geometry, material);
        //console.log(pathX + " " + pathY)
        cube.position.x = pathX[index];
        cube.position.y = pathY[index];
        shieldPoseX.push(pathX[index]);
        shieldPoseY.push(pathY[index]);
        cube.position.z = 0.4;
        cube.rotation.y = 0;
        cube.rotation.z = 0;
        shield.push(cube);
        setInterval(() => {
            cube.rotation.x = rotate += 0.05;
        }, 100);
        //     cube.userData = `${i}${j}`;
        //sheildArray.push(cube);
        scene.add(cube);

        //}


    }
    console.log("sheild : " + shieldPoseX + " " + shieldPoseY)

    var shieldmaterial = new THREE.Mesh(dummy, material)
    return shieldmaterial;
}

//---------------------------------Create obstacle-------------------------------

var obstaclePoseX = [],
    obstaclePoseY = [],
    shield = [],
    index = [];

function generate_obstacle_mesh(field) {
    var dummy = new THREE.Geometry();
    let material = new THREE.MeshLambertMaterial({ map: obstacleTexture });
    var levelCopy = (level + 1) * 2;
    var count = levelCopy;
    console.log(count)
    for (let i = 0; i < count; i++) {
        index.push(Math.floor(Math.random() * pathX.length))
    }
    //    console.log(index)
    for (let i = 0; i < count; i++) {
        //create obstacle
        var obstacleDef = new b2BodyDef();
        obstacleDef.type = b2Body.b2_dynamicBody;
        var x = index[i]
        var y = index[i]
        console.log(pathX[x] + " " + pathY[y])
        obstacleDef.position.Set((pathX[x] + 0.5), (pathY[y] + 0.5));
        obs = wWorld.CreateBody(obstacleDef);
        var obsDef = new b2FixtureDef();
        obsDef.density = 1.0;
        obsDef.userData = "obstacle";
        obsDef.friction = 0.0;
        obsDef.restitution = 0.25;
        obsDef.shape = new b2CircleShape(0.1);
        obs.CreateFixture(obsDef);
    }
    console.log(index)
    var rotate = 0;
    for (let i = 0; i < count; i++) {
        //if (!field[poseX][poseY]) {
        const geometry = new THREE.SphereGeometry(0.3, 0.3, 0.3, 100);
        let cube = new THREE.Mesh(geometry, material);
        //console.log(poseX + " " + poseY)
        var x = index[i]
        var y = index[i]
        console.log(pathX[x] + " " + pathY[y])
        cube.position.x = pathX[x] + 0.5;
        cube.position.y = pathY[y] + 0.5;
        obstaclePoseX.push(pathX[x]);
        obstaclePoseY.push(pathY[y]);
        cube.position.z = 0.4;
        cube.rotation.y = 0;
        cube.rotation.z = 0;
        //shield.push(cube);
        setInterval(() => {
            cube.rotation.x = rotate += 0.05;
        }, 100);
        scene.add(cube);

    }

    //}

    // }


    var obstacleMaterial = new THREE.Mesh(dummy, material)
    return obstacleMaterial;
}


function createRenderWorld() {

    // Create the scene object.
    scene = new THREE.Scene();

    // Add the light.
    light = new THREE.PointLight(0xffffff, 1);
    light.position.set(1, 1, 1.3);
    scene.add(light);

    // Add the ball.
    var g = new THREE.SphereGeometry(ballRadius, 32, 16);
    var m = new THREE.MeshPhongMaterial({
        map: ironTexture
    });
    ballMesh = new THREE.Mesh(g, m);
    ballMesh.position.set(1, 1, ballRadius);
    scene.add(ballMesh);

    g = new THREE.SphereGeometry(0.3, 32, 16);
    m = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    collisioneffect = new THREE.Mesh(g, m);

    g = new THREE.SphereGeometry(0.5, 35, 17);
    m = new THREE.MeshPhongMaterial({ color: 0xff2cf3 });
    coineffect = new THREE.Mesh(g, m);

    // Add the camera.
    var aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(60, aspect, 1, 1000);
    camera.position.set(1, 1, 5);
    scene.add(camera);

    // Add the maze.
    mazeMesh = generate_maze_mesh(maze);
    scene.add(mazeMesh);

    //Add coin maze
    coinMesh = generate_coin_mesh(maze);
    scene.add(coinMesh);

    //add shield
    var shieldMesh = generate_Shield_mesh(maze);
    scene.add(shieldMesh);

    //add obstacle
    var obstacleMesh = generate_obstacle_mesh(maze);
    scene.add(obstacleMesh)

    //Adding flag at end of game
    g = new THREE.CubeGeometry(0.1, 1, 2, 1);
    m = new THREE.MeshPhongMaterial({ map: flagTexture });
    flagimag = new THREE.Mesh(g, m);
    flagimag.position.set(mazeDimension - 1, mazeDimension - 2, 0);
    flagimag.rotation.y = 0.5;
    scene.add(flagimag);


    // Add the ground.
    g = new THREE.PlaneGeometry(mazeDimension * 10, mazeDimension * 10, mazeDimension, mazeDimension);
    planeTexture.wrapS = planeTexture.wrapT = THREE.RepeatWrapping;
    planeTexture.repeat.set(mazeDimension * 5, mazeDimension * 5);
    m = new THREE.MeshPhongMaterial({
        map: planeTexture
    });
    planeMesh = new THREE.Mesh(g, m);
    planeMesh.position.set((mazeDimension - 1) / 2, (mazeDimension - 1) / 2, 0);
    planeMesh.rotation.set(Math.PI / 2, 0, 0);
    scene.add(planeMesh);

}
document.getElementById('score').innerHTML = "Score:" + scores;

function updatePhysicsWorld() {

    // Apply "friction". 
    var lv = wBall.GetLinearVelocity();
    lv.Multiply(0.80);
    wBall.SetLinearVelocity(lv);

    // Apply user-directed force.
    var f = new b2Vec2(keyAxis[0] * wBall.GetMass() * 0.25, keyAxis[1] * wBall.GetMass() * 0.25);
    wBall.ApplyImpulse(f, wBall.GetPosition());
    keyAxis = [0, 0];

    // Take a time step.
    wWorld.Step(1 / 60, 8, 3);

    if (Math.floor(wBall.GetPosition().x) > mazeDimension - 4 && Math.floor(wBall.GetPosition().y) > mazeDimension - 4) {
        scene.add(flagimag);
        flagimag.userData = 'flag';
    } else {
        scene.remove(flagimag);
    }
    if (Math.floor(wBall.GetPosition().x) == mazeDimension - 1 && Math.floor(wBall.GetPosition().y) == mazeDimension - 2) {

        var audio = new Audio('audio/flag.wav');
        audio.play();
    }

}

//collision code
const coinArray = [];
var edscore;
//const shieldArray = [];
var highscore = [];
let isPowerON = false;
const onContact = (contact) => {

    var fixtureA = contact.GetFixtureA();
    var fixtureB = contact.GetFixtureB();
    //ball coin collision
    if (fixtureA.GetUserData() === "wall" && fixtureB.GetUserData() === "ball") {
        if (isPowerON == false) {
            hit += 1;
            ballMesh.material.map = THREE.ImageUtils.loadTexture('images/hit.PNG');
            ballMesh.material.needsUpdate = true;
            setTimeout(() => {
                ballMesh.material.map = THREE.ImageUtils.loadTexture('/ball.png');
                ballMesh.material.needsUpdate = true;
            }, 200);
            var audio = new Audio('audio/wallHit.wav');
            audio.play();

            var modal = document.getElementById("modal");
            if (hit > 3) {
                modal.style.display = "block";
                modal.style.visibility = 'visible';
                var audio = new Audio('audio/gameOver.wav');
                audio.play();
                edscore = scores;
                updateData(edscore);

                document.getElementById("endScore").innerHTML = edscore;
                scores = 0;
                document.getElementById('score').innerHTML = "Score:" + scores;
                var span = document.getElementsByClassName("play-again")[0];
                gameOver = true;
                span.onclick = function() {
                    modal.style.display = "none";
                    freezBall();
                    gameState = 'fade out';

                }
                clock.stop();
                console.log("EndTime:", clock.getElapsedTime());
                hit = 0;

            }
        }
    }

    //ball destroyer collision
    else if (fixtureA.GetUserData() === "ball" && fixtureB.GetUserData() === "obstacle") {
        gameOver = true;
        if (isPowerON == false) {

            var modal = document.getElementById("modal");
            modal.style.visibility = 'visible';
            var audio = new Audio('audio/gameOver.wav');
            audio.play();
            gameOver = true;
            var span = document.getElementsByClassName("play-again")[0];
            span.onclick = function() {
                modal.style.display = "none";
                gameState = 'fade out';
                freezBall();

            }

            edscore = scores;
            updateData(edscore);
            document.getElementById('endScore').innerHTML = edscore;
            scores = 0;
            // document.getElementById('scoreValue').innerHTML = scores;
            clock.stop();
            console.log("EndTime:", clock.getElapsedTime());
        }
        isPowerON = true
    }

    //ball shield collision
    else if (fixtureA
        .GetUserData() === "ball" && fixtureB.GetUserData() === "Shield") {
        shieldArray.push(fixtureB);
        ballMesh.material.map = THREE.ImageUtils.loadTexture("images/shi.png");
        ballMesh.material.needsUpdate = true;
        isPowerON = true;
        var audio = new Audio('audio/sheild.wav');
        audio.play();
        // console.log("before 20sec"+ isPowerON)
        setTimeout(() => {
            isPowerON = false;
            //console.log("after 20sec"+ isPowerON)
            ballMesh.material.map = THREE.ImageUtils.loadTexture('ball.png');
            //ballMesh.material.needsUpdate = true;
        }, 10000)

    }

}
var ballX, ballY;

function updateRenderWorld() {

    // Update ball position.
    var stepX = wBall.GetPosition().x - ballMesh.position.x;
    var stepY = wBall.GetPosition().y - ballMesh.position.y;
    ballMesh.position.x += stepX;
    ballMesh.position.y += stepY;
    //taking  ball positions
    ballX = Math.round(ballMesh.position.x);
    ballY = Math.round(ballMesh.position.y);
    // Update ball rotation.
    var tempMat = new THREE.Matrix4();
    tempMat.makeRotationAxis(new THREE.Vector3(0, 1, 0), stepX / ballRadius);
    tempMat.multiplySelf(ballMesh.matrix);
    ballMesh.matrix = tempMat;
    tempMat = new THREE.Matrix4();
    tempMat.makeRotationAxis(new THREE.Vector3(1, 0, 0), -stepY / ballRadius);
    tempMat.multiplySelf(ballMesh.matrix);
    ballMesh.matrix = tempMat;
    ballMesh.rotation.getRotationFromMatrix(ballMesh.matrix);

    // Update camera and light positions.
    camera.position.x += (ballMesh.position.x - camera.position.x) * 0.1;
    camera.position.y += (ballMesh.position.y - camera.position.y) * 0.1;
    camera.position.z += (5 - camera.position.z) * 0.1;
    light.position.x = camera.position.x;
    light.position.y = camera.position.y;
    light.position.z = camera.position.z - 3.7;


    //------------------------remove coin-----------------------------

    for (let n = 0; n < coinAnimate.length; n++) {
        if (pathX[n] == ballX && pathY[n] == ballY) {
            // coinPoseX[n] = 0;
            //coinPoseY[n] = 0;
            var audio = new Audio('audio/coin.wav');
            audio.play();
            pathX[n] = 0;
            pathY[n] = 0;
            console.log("remove")
            scene.remove(coinAnimate[n])
                //console.log(coinAnimate[n])
            scores = scores + 1;


            document.getElementById('score').innerHTML = "Score:" + scores;
            if (isPowerON == false) {
                ballMesh.material.map = THREE.ImageUtils.loadTexture('images/coinHit.PNG');
                ballMesh.material.needsUpdate = true;
                setTimeout(() => {
                    ballMesh.material.map = THREE.ImageUtils.loadTexture('/ball.png');
                    ballMesh.material.needsUpdate = true;
                }, 500);
            } else {
                ballMesh.material.map = THREE.ImageUtils.loadTexture("images/shi.png");
                ballMesh.material.needsUpdate = true;
            }
        }

    }

    //------------------------------remove shield-----------------------------------

    for (let i = 0; i < shieldPoseX.length; i++) {
        // console.log(shieldPoseX[i] + " " + shieldPoseY[i])
        if (shieldPoseX[i] == ballX && shieldPoseY[i] == ballY) {
            shieldPoseX[i] = 0;
            shieldPoseY[i] = 0;
            console.log("remove shield")
            scene.remove(shield[i]);

            ballMesh.material.map = THREE.ImageUtils.loadTexture("images/shi.png");
            ballMesh.material.needsUpdate = true;
            isPowerON = true;
            var audio = new Audio('audio/sheild.wav');
            audio.play();
            // console.log("before 20sec"+ isPowerON)
            setTimeout(() => {
                isPowerON = false;
                //console.log("after 20sec"+ isPowerON)
                ballMesh.material.map = THREE.ImageUtils.loadTexture('ball.png');
                ballMesh.material.needsUpdate = true;

            }, 10000)
        }
    }

    return ballMesh;

}


function gameLoop() {

    switch (gameState) {

        case 'initialize':

            maze = generateSquareMaze(mazeDimension);
            maze[mazeDimension - 1][mazeDimension - 2] = false;
            createPhysicsWorld();
            createRenderWorld();
            camera.position.set(1, 1, 5);
            light.position.set(1, 1, 1.3);
            light.intensity = 0;

            level = Math.floor((mazeDimension - 1) / 2 - 4);
            $('#level').html('Level ' + level);
            gameState = 'fade in';

            break;

        case 'fade in':
            light.intensity += 0.1 * (1.0 - light.intensity);
            renderer.render(scene, camera);
            if (Math.abs(light.intensity - 1.0) < 0.05) {
                light.intensity = 1.0;
                gameState = 'play'
                clock = new THREE.Clock;
                clock.start();
                // var audio = new Audio('audio/sheild.wav');
                // audio.play();

            }


            break;

        case 'play':
            // Check for victory.

            var mazeX = Math.floor(ballMesh.position.x + 0.5);
            var mazeY = Math.floor(ballMesh.position.y + 0.5);

            updatePhysicsWorld();
            updateRenderWorld();
            renderer.render(scene, camera);
            var listener = new Box2D.Dynamics.b2ContactListener;
            listener.BeginContact = function(contact) {
                onContact(contact);
            }
            wWorld.SetContactListener(listener);

            if (mazeX == mazeDimension && mazeY == mazeDimension - 2) {
                mazeDimension += 2;
                gameState = 'fade out';
            }


            break;

        case 'fade out':

            updatePhysicsWorld();
            updateRenderWorld();
            light.intensity += 0.1 * (0.0 - light.intensity);
            renderer.render(scene, camera);
            if (Math.abs(light.intensity - 0.0) < 0.1) {
                light.intensity = 0.0;
                renderer.render(scene, camera);
                gameState = 'initialize';

            }

            break;

    }

    requestAnimationFrame(gameLoop);

}


function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}


function onMoveKey(axis) {
    keyAxis = axis.slice(0);
}


jQuery.fn.centerv = function() {
    var wh = window.innerHeight;
    var h = this.outerHeight();
    this.css("position", "absolute");
    this.css("top", Math.max(0, (wh - h) / 2) + "px");
    return this;
}


jQuery.fn.centerh = function() {
    var ww = window.innerWidth;
    var w = this.outerWidth();
    this.css("position", "absolute");
    this.css("left", Math.max(0, (ww - w) / 2) + "px");
    return this;
}


jQuery.fn.center = function() {
    this.centerv();
    this.centerh();
    return this;
}


$(document).ready(function() {

    // Prepare the instructions.
    $('#instructions').center();
    $('#instructions').hide();
    KeyboardJS.bind.key('i', function() {
            $('#instructions').show()
        },
        function() {
            $('#instructions').hide()
        });

    // Create the renderer.
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Bind keyboard and resize events.
    KeyboardJS.bind.axis('left', 'right', 'down', 'up', onMoveKey);
    KeyboardJS.bind.axis('h', 'l', 'j', 'k', onMoveKey);



    $(window).resize(onResize);


    // Set the initial game state.
    gameState = 'initialize';
    //animAudio(startGameSound);

    // Start the game loop.
    requestAnimationFrame(gameLoop);

})


function endgame() {
    gameState = 'fade out';
}

function menuToggle() {
    const toggleMenu = document.querySelector('.menu');
    toggleMenu.classList.toggle('active')
}


function gameEndGif() {
    const toggle = document.querySelector('.model');
    toggle.visibility('visible');
    updateData()
    document.getElementById("ensScore").innerHTML = scores;

}

var name;
firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
        location.replace("index.html")
    } else {
        var email = user.email;
        name = email.substring(0, email.indexOf("@"));

        document.getElementById("email").innerHTML = user.email
    }
})


function logout() {
    firebase.auth().signOut()
}

function leaderBoard() {
    const leader = document.querySelector('.leader-board');
    leader.classList.toggle('active')
    updateData()
}

function updateData(score) {
    console.log(name)
        //   var email = profile.email;
    var score = score;
    var EndTime = clock.getElapsedTime()
    update(ref(database, 'users/' + name), {
        score: score,
        EndTime: EndTime,
    });
    gameState = 'fade out';
    hit = 0;
    scores = 0;
    document.getElementById('score').innerHTML = "Score:" + scores;
    console.log("final score : " + score)

}


function freezBall() {
    gameOver = false;
    // setTimeout("location.reload(true);", 100)
    console.log(gameOver)
}