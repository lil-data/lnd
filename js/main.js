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
    stats.domElement.style.left = '500px';
    document.body.appendChild(stats.domElement);

    myImageUpload.addEventListener('change', handleMyImage, false);

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

    socket.on('userDidUploadImage', function(user, index, img) {
        console.log("img: " + img);
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
        geometry.faces[i].materialIndex = 0;

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

function handleMyImage() {
    var img = myImageUpload.files[0];
    var reader = new FileReader();
    reader.onload = (function(aImg) {
        return function(e) {
            // aImg.src = e.target.result;
            socket.emit('userDidUploadImage', me, myIndex, e.target.result);
            addImageAsTexture(me, e.target.result);
            me.img = true;
        };
    })(myImagePreview);
    reader.readAsDataURL(img);
}

function addImageAsTexture(user, target) {
    var texture = new Image(256,256);
    texture.src = target;
    // texture.width = 256;
    // texture.height = 256;
    console.log(texture.width);

    var imgTxt = new THREE.ImageUtils.loadTexture(target);
    imgTxt.wrapS = THREE.ClampToEdgeWrapping;
    imgTxt.wrapT = THREE.ClampToEdgeWrapping;
    imgTxt.wrapS = THREE.MirroredRepeatWrapping;
    imgTxt.wrapT = THREE.MirroredRepeatWrapping;
    imgTxt.repeat.set(1, 1);
    scene.getObjectByName(user.id).material.map = imgTxt;
    scene.getObjectByName(user.id).material.needsUpdate = true;
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
        // event.preventDefault();

        transformTouch(event);
        scene.getObjectByName(me.id).position.copy(touch);
        updateMyPosition();
    }
}

function onDocumentTouchMove(event) {

    if (event.touches.length === 1) {
        // event.preventDefault();

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


function render() {
    stats.begin();
    renderer.render(scene, camera);
    stats.end();
    requestAnimationFrame(render);
}

function render() {
    renderer.render(scene, camera);
}
