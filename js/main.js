/* @flow */
var camera, scene, renderer, light, stats;

init();
animate();

function init() {

    document.body.appendChild(renderer.domElement);
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // camera
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(0, 150, 500);
    light = new THREE.PointLight(0xffffff, 0.8);
    camera.add(light);

    scene = new THREE.Scene();

    // voronoi
    var voronoi = new Voronoi();
    var bbox = {
        xl: 0,
        xr: window.innerWidth,
        yt: 0,
        yb: window.innerHeight
    };
    var sites = [{
        x: 100,
        y: 200
    }, {
        x: 50,
        y: 250
    }, {
        x: 50,
        y: 100
    } /* , ... */ ];
    var diagram = voronoi.compute(sites, bbox);

    console.log(diagram);

    var geometry = new THREE.Geometry();

    for (var vertex in diagram.vertices) {
        geometry.vertices.push(new THREE.Vector3(
            diagram.vertices[vertex].x,
            diagram.vertices[vertex].y,
            0.0));
    }

    var material = new THREE.LineBasicMaterial({
        color: 0xfff3ff,
        linewidth: 5
    });
    var mesh = new THREE.Mesh(geometry, material);

    console.log(geometry.vertices);

    scene.add(mesh);

    // renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    container.appendChild( stats.domElement );
}

function onDocumentTouchStart(event) {
    if (event.touches.length === 1) {

        event.preventDefault();

        // mouseXOnMouseDown = event.touches[0].pageX - windowHalfX;
    }
}

function onDocumentTouchMove(event) {
    if (event.touches.length === 1) {

        event.preventDefault();

        // mouseX = event.touches[0].pageX - windowHalfX;
    }
}


function animate() {
    requestAnimationFrame(animate);

    render();
    stats.update();
}

function render() {
    renderer.render(scene, camera);
}