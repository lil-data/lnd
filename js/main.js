/* @flow */
var camera, scene, renderer, light, stats, container, socket;

var size = 50,
    mouse = new THREE.Vector3(),
    touch = new THREE.Vector3();

var me = {
    id: "",
    x: 0,
    y: 0,
    img: false
};
var myIndex = 0;
var myImageUpload = document.getElementById('uploadImage');
var myImagePreview = document.getElementById('preview');
var myImage = new Image();
var users = [];

init();
comms();
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

    myImageUpload.addEventListener('change', uploadMyImage, false);

    document.addEventListener('mousedown', onDocumentMouseDown, false);
    document.addEventListener('touchstart', onDocumentTouchStart, false);
    document.addEventListener('touchmove', onDocumentTouchMove, false);
    document.addEventListener('touchend', onDocumentTouchEnd, false);
}

function comms() {
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
        updateCube(user);
    });

    socket.on('userDidUploadImage', function(user, index, img) {
       console.log(img); 
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
    newCube(me);
}

function updateMyPosition() {
    me.x = scene.getObjectByName(me.id).position.x;
    me.y = scene.getObjectByName(me.id).position.y;
    socket.emit('userDidUpdate', me, myIndex);
    users[myIndex] = me;
}

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

function uploadMyImage() {
    var img = myImageUpload.files[0];
    var reader = new FileReader();
    reader.onload = (function(aImg) {
        return function(e) {
            aImg.src = e.target.result;
        };
    })(myImagePreview);
    reader.readAsDataURL(img);
    console.log(myImagePreview.src);

    // trim the image
    // add it as face to cube
    // upload to server

    socket.emit('userDidUploadImage', me, myIndex, myImagePreview.src);
    me.img = true;
}

function onDocumentMouseDown(event) {

    event.preventDefault();

    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('mouseup', onDocumentMouseUp, false);
    document.addEventListener('mouseout', onDocumentMouseOut, false);

    transformMouse(event);
    scene.getObjectByName(me.id).position.copy(mouse);
    updateMyPosition();
}

function onDocumentMouseMove(event) {
    transformMouse(event);
    scene.getObjectByName(me.id).position.copy(mouse);
    updateMyPosition();
}

function onDocumentMouseUp(event) {

    document.removeEventListener('mousemove', onDocumentMouseMove, false);
    document.removeEventListener('mouseup', onDocumentMouseUp, false);
    document.removeEventListener('mouseout', onDocumentMouseOut, false);

    transformMouse(event);
    scene.getObjectByName(me.id).position.copy(mouse);
    updateMyPosition();
}

function onDocumentMouseOut(event) {

    document.removeEventListener('mousemove', onDocumentMouseMove, false);
    document.removeEventListener('mouseup', onDocumentMouseUp, false);
    document.removeEventListener('mouseout', onDocumentMouseOut, false);

}

function transformMouse(event) {
    mouse.x = event.clientX - 800;
    mouse.y = -event.clientY + 450;
}

function transformTouch(event) {
    touch.x = event.touches[0].pageX - 500;
    touch.y = -event.touches[0].pageY + 500;
}

function onDocumentTouchStart(event) {

    if (event.touches.length === 1) {
        event.preventDefault();

        transformTouch(event);
        scene.getObjectByName(me.id).position.copy(touch);
        updateMyPosition();
    }
}

function onDocumentTouchMove(event) {

    if (event.touches.length === 1) {
        event.preventDefault();

        transformTouch(event);
        scene.getObjectByName(me.id).position.copy(touch);
        updateMyPosition();

    }
}

function onDocumentTouchEnd(event) {
    transformTouch(event);
    scene.getObjectByName(me.id).position.copy(touch);
    updateMyPosition();
}


function animate() {
    requestAnimationFrame(animate);
    render();
    stats.update();
}

function render() {
    renderer.render(scene, camera);
}