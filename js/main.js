/* @flow */
var camera, scene, renderer, light, stats, container, socket;

var size = 50;

var me = {
    id: "",
    x: 0,
    y: 0
};
var myIndex = 0;
var users = [];
// var targetRotation = 0;
// var targetRotationOnMouseDown = 0;

// var mouseX = 0;
// var mouseXOnMouseDown = 0;

// var windowHalfX = window.innerWidth / 2;
// var windowHalfY = window.innerHeight / 2;

init();
chat();
animate();

function init() {
    socket = io('https://lnd.herokuapp.com/');

    scene = new THREE.Scene();
    // renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    document.body.appendChild(renderer.domElement);
    renderer.setSize(window.innerWidth, window.innerHeight);
    // camera
    // camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
    // camera.position.set(0, 150, 500);
    // light = new THREE.PointLight(0xffffff, 0.8);
    // camera.add(light);
    // voronoi
    // var voronoi = new Voronoi();
    // var bbox = {
    //     xl: 0,
    //     xr: window.innerWidth,
    //     yt: 0,
    //     yb: window.innerHeight
    // };
    // var sites = [{
    //     x: 100,
    //     y: 200
    // }, {
    //     x: 50,
    //     y: 250
    // }, {
    //     x: 50,
    //     y: 100
    // } /* , ... */ ];
    // var diagram = voronoi.compute(sites, bbox);
    // console.log(diagram);
    // var geometry = new THREE.Geometry();
    // for (var vertex in diagram.vertices) {
    //     geometry.vertices.push(new THREE.Vector3(
    //         diagram.vertices[vertex].x,
    //         diagram.vertices[vertex].y,
    //         0.0));
    // }
    // var material = new THREE.LineBasicMaterial({
    //     color: 0xfff3ff,
    //     linewidth: 5
    // });
    // var mesh = new THREE.Mesh(geometry, material);
    // console.log(geometry.vertices);
    // scene.add(mesh);
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.y = 150;
    camera.position.z = 500;

    renderer.setClearColor(0xf0f0f0);
    renderer.setPixelRatio(window.devicePixelRatio);

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    document.body.appendChild(stats.domElement);

    document.addEventListener('touchstart', onDocumentTouchStart, false);
    document.addEventListener('touchmove', onDocumentTouchMove, false);
    document.addEventListener('touchend', onDocumentTouchEnd, false);
}

function chat() {
    // $('form').submit(function() {
    //     socket.emit('chat message', $('#m').val());
    //     $('#m').val('');
    //     return false;
    // });
    // socket.on('chat message', function(msg) {
    //     $('#messages').append($('<li>').text(msg));
    // });

    socket.on('initUser', function(theusers, id, index) {
        initMe(id, index);
        for (var i = 0; i < theusers.length; i++) {
            users.push(theusers[i]);
            newCube(theusers[i]);
        }
        console.log("Look who arrived...\n" + JSON.stringify(theusers));
        console.log("I am: " + id + " at Index: " + myIndex);
    });

    socket.on('userDidInit', function(user) {
        users.push(user);
        console.log(user.id + " joined at (" + user.x + ", " + user.y + ")");
        newCube(user);
    });

    socket.on('userDidDisconnect', function(id) {
        for (var i = 0; i < users.length; i++) {
            try {
                if (users[i].id == id) {
                    scene.remove(scene.getObjectByName(id));
                    users.splice(i, 1);
                    break;
                }
            } catch (e) {}
        }
        if (myIndex !== 0) {
            myIndex--;
        }
        console.log(id + " disconnected");
    });

    socket.on('userDidUpdate', function(user, index) {
        users[index] = user;
        console.log(user.id + " updated to (" + user.x + ", " + user.y + ")");
    });
}

function initMe(id, index) {

    me.id = id;
    myIndex = index;

    me.x = Math.floor(Math.random() * 5) * size;
    me.y = Math.floor(Math.random() * 5) * size;
    socket.emit('userDidInit', me, myIndex);

    users[myIndex] = me;
    newCube(me);

    // for (var i = 0; i < users.length; i++) {
    //     if (users[i].id != id) {
    //         displayUser(users[i].x, users[i].y);
    //     } else {
    //         createNewUser(users[i].x, users[i].y);
    //     }
    // }
}

// function updateMe() {
//     socket.emit('userDidUpdate', me, myIndex);
//     users[myIndex] = me;
// }

// function displayUser(x, y) {
//     newCube(x, y);
// }

// function createNewUser(x, y) {
//     x = Math.floor(Math.random() * 5) * size;
//     y = Math.floor(Math.random() * 5) * size;
//     newCube(x, y);
//     updateUserCoords(myid, x, y);
// }

// function updateUserCoords(myid, x, y) {
//     socket.emit('updateUserCoords', myid, x, y);
// }

function newCube(user) {
    var geometry = new THREE.BoxGeometry(size, size, size);

    for (var i = 0; i < geometry.faces.length; i += 2) {

        var hex = Math.random() * 0xffffff;
        geometry.faces[i].color.setHex(hex);
        geometry.faces[i + 1].color.setHex(hex);

    }

    var material = new THREE.MeshBasicMaterial({
        vertexColors: THREE.FaceColors,
        overdraw: 0.5
    });

    var cube = new THREE.Mesh(geometry, material);
    cube.name = user.id;
    cube.position.x = user.x;
    cube.position.y = user.y;

    scene.add(cube);
}

function onDocumentTouchStart(event) {

    if (event.touches.length === 1) {

        console.log("Touch did start");

        event.preventDefault();

        // mouseXOnMouseDown = event.touches[0].pageX - windowHalfX;
        // targetRotationOnMouseDown = targetRotation;

    }

}

function onDocumentTouchMove(event) {

    if (event.touches.length === 1) {

        console.log("Touch did move");

        event.preventDefault();

        // mouseX = event.touches[0].pageX - windowHalfX;
        // targetRotation = targetRotationOnMouseDown + (mouseX - mouseXOnMouseDown) * 0.05;

    }

}

function onDocumentTouchEnd(event) {
    // if (event.touches.length == 1) {

    console.log("Touch did end");
    // }
}


function animate() {
    requestAnimationFrame(animate);

    render();
    stats.update();
}

function render() {
    // plane.rotation.y = cube.rotation.y += (targetRotation - cube.rotation.y) * 0.05;
    renderer.render(scene, camera);
}