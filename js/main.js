/* @flow */
var camera, scene, renderer, light, stats, container, socket;

var size = 50,
    mouse = new THREE.Vector3();

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
render();
update();

function init() {
    socket = io('https://lnd.herokuapp.com/');

    scene = new THREE.Scene();
    // renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    document.body.appendChild(renderer.domElement);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // voronoi
    var voronoi = new Voronoi();
    var bbox = {xl: -window.innerWidth/2, xr: window.innerWidth/2, yt: 0, yb: window.innerHeight};
    var sites = [
        {x: 10, y: 100},
        {x: 200, y: 400}];
    var diagram = voronoi.compute(sites, bbox);
    console.log(diagram);

    // add square background shape
    var rectShape = new THREE.Shape();
    rectShape.moveTo(bbox.xl, bbox.yt);
    rectShape.lineTo(bbox.xr, bbox.yt);
    rectShape.lineTo(bbox.xr, bbox.yb);
    rectShape.lineTo(bbox.xl, bbox.yb);
    rectShape.lineTo(bbox.xl, bbox.yt);

    var rectMesh = new THREE.Mesh(
        new THREE.ShapeGeometry(rectShape),
        new THREE.MeshBasicMaterial({color: 0xff00f0}));
    scene.add(rectMesh);

    // add voronoi verticies
    var geometry = new THREE.Geometry();
    for (var v in diagram.vertices) {
        geometry.vertices.push(new THREE.Vector3(
            diagram.vertices[v].x,
            diagram.vertices[v].y,
            0.0));
    }
    var material = new THREE.PointCloudMaterial({
        color: 0xffffff,
        vertexColors: THREE.VertexColors,
        size: 10});
    var pointCloud = new THREE.PointCloud(geometry, material);
    scene.add(pointCloud);

    // add voronoi cells
    var geometry2 = new THREE.Geometry();
    for (var c in diagram.cells) {
        geometry2.vertices.push(new THREE.Vector3(
            diagram.cells[c].site.x,
            diagram.cells[c].site.y,
            0.0));
    }
    var material2 = new THREE.PointCloudMaterial({
        color: 0x444444,
        vertexColors: THREE.VertexColors,
        size: 30});
    var pointCloud2 = new THREE.PointCloud(geometry2, material2);
    scene.add(pointCloud2);

    // add voronoi edges
    for (var e in diagram.edges) {
        var edge = diagram.edges[e];
        var shapeGeom = new THREE.Geometry();
        shapeGeom.vertices.push(new THREE.Vector3(edge.va.x, edge.va.y, 0));
        shapeGeom.vertices.push(new THREE.Vector3(edge.vb.x, edge.vb.y, 0));

        var line = new THREE.Line(shapeGeom, new THREE.LineBasicMaterial({color: 0xffffff, linewidth: 20}));
        console.log(shapeGeom.vertices);
        scene.add(line);
    }

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.y = 150;
    camera.position.z = 500;

    renderer.setClearColor(0xaaaaaa);
    renderer.setPixelRatio(window.devicePixelRatio);

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    document.body.appendChild(stats.domElement);

    document.addEventListener('mousedown', onDocumentMouseDown, false);
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
            // newCube(theusers[i]);
        }
        console.log("Look who arrived...\n" + JSON.stringify(theusers));
        console.log("I am: " + id + " at Index: " + myIndex);
    });

    socket.on('userDidInit', function(user) {
        users.push(user);
        console.log(user.id + " joined at (" + user.x + ", " + user.y + ")");
        // newCube(user);
    });

    socket.on('userDidDisconnect', function(id) {
        for (var i = 0; i < users.length; i++) {
            try {
                if (users[i].id == id) {
                    // scene.remove(scene.getObjectByName(id));
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
        // updateCube(user);
    });
}

function updateCube(user) {
    var pos = new THREE.Vector3(user.x, user.y, 0);
    scene.getObjectByName(user.id).position.copy(pos);
}

function initMe(id, index) {

    me.id = id;
    myIndex = index;

    me.x = Math.floor(Math.random() * 5) * size;
    me.y = Math.floor(Math.random() * 5) * size;
    socket.emit('userDidInit', me, myIndex);

    users[myIndex] = me;
    // newCube(me);

    // for (var i = 0; i < users.length; i++) {
    //     if (users[i].id != id) {
    //         displayUser(users[i].x, users[i].y);
    //     } else {
    //         createNewUser(users[i].x, users[i].y);
    //     }
    // }
}

function updateMe() {
    me.x = scene.getObjectByName(me.id).position.x;
    me.y = scene.getObjectByName(me.id).position.y;
    socket.emit('userDidUpdate', me, myIndex);
    users[myIndex] = me;
}

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

function onDocumentMouseDown(event) {

    event.preventDefault();

    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('mouseup', onDocumentMouseUp, false);
    document.addEventListener('mouseout', onDocumentMouseOut, false);

    transformMouse(event);
    scene.getObjectByName(me.id).position.copy(mouse);
    updateMe();
}

function transformMouse(event) {
    mouse.x = event.clientX-800;
    mouse.y = -event.clientY+450;
}

function onDocumentMouseMove(event) {
    transformMouse(event);
    scene.getObjectByName(me.id).position.copy(mouse);
    updateMe();
}

function onDocumentMouseUp(event) {

    document.removeEventListener('mousemove', onDocumentMouseMove, false);
    document.removeEventListener('mouseup', onDocumentMouseUp, false);
    document.removeEventListener('mouseout', onDocumentMouseOut, false);

    transformMouse(event);
    scene.getObjectByName(me.id).position.copy(mouse);
    updateMe();
}

function onDocumentMouseOut(event) {

    document.removeEventListener('mousemove', onDocumentMouseMove, false);
    document.removeEventListener('mouseup', onDocumentMouseUp, false);
    document.removeEventListener('mouseout', onDocumentMouseOut, false);

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
    console.log("Touch did end");

}


function render() {
    stats.begin();
    renderer.render(scene, camera);
    stats.end();
    requestAnimationFrame(render);
}

function update() {
    // plane.rotation.y = cube.rotation.y += (targetRotation - cube.rotation.y) * 0.05;
    setTimeout(update, 1000/60); // 60 fps
}
