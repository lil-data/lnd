var socket = io('/chat');

var newMessage;
var isNewMessage = false;

var limit = 20;

$('form').submit(function() {

	socket.emit('chat message', $('#m').val());
	// $('#messages').append($('<li>').text($('#m').val()));
	newMessage = $('#m').val();
	isNewMessage = true;
	$('#m').val('');
	return false;
});

socket.on('chat message', function(msg) {
	// $('#messages').append($('<li>').text(msg));
	spawnText(msg);
});

'use strict';

Physijs.scripts.worker = './js/lib/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

var initScene, render, _boxes = [],
	spawnBox, spawnText, group, text,
	renderer, render_stats, physics_stats, scene, ground_material, ground, light, camera;

var ids = {};

initScene = function() {
	renderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: true,
	});
	renderer.setClearColor(0x000000, 0);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
	document.getElementById('viewport').appendChild(renderer.domElement);

	// render_stats = new Stats();
	// render_stats.domElement.style.position = 'absolute';
	// render_stats.domElement.style.top = '0px';
	// render_stats.domElement.style.zIndex = 100;
	// document.getElementById( 'viewport' ).appendChild( render_stats.domElement );

	// physics_stats = new Stats();
	// physics_stats.domElement.style.position = 'absolute';
	// physics_stats.domElement.style.top = '50px';
	// physics_stats.domElement.style.zIndex = 100;
	// document.getElementById( 'viewport' ).appendChild( physics_stats.domElement );

	scene = new Physijs.Scene;
	scene.setGravity(new THREE.Vector3(0, 10, 0));
	scene.addEventListener(
		'update',
		function() {
			scene.simulate(undefined, 1);
			// physics_stats.update();
		}
	);

	camera = new THREE.PerspectiveCamera(
		35,
		window.innerWidth / window.innerHeight,
		1,
		1000
	);
	camera.position.set(60, 50, 60);
	camera.lookAt(scene.position);
	scene.add(camera);

	// Light
	light = new THREE.DirectionalLight(0xFFFFFF);
	light.position.set(20, 40, -15);
	light.target.position.copy(scene.position);
	light.castShadow = true;
	light.shadowCameraLeft = -60;
	light.shadowCameraTop = -60;
	light.shadowCameraRight = 60;
	light.shadowCameraBottom = 60;
	light.shadowCameraNear = 20;
	light.shadowCameraFar = 200;
	light.shadowBias = -.0001
	light.shadowMapWidth = light.shadowMapHeight = 2048;
	light.shadowDarkness = .7;
	scene.add(light);

	requestAnimationFrame(render);
	scene.simulate();
};


function spawnText(msg) {
	var text_geometry = new THREE.TextGeometry(msg, {
		size: 5,
		height: 3,
		curveSegments: 4,
		font: "helvetiker"
	});
	text_geometry.computeBoundingBox();

	var txt, material;

	var centerOffset = -0.5 *
		(text_geometry.boundingBox.max.x -
			text_geometry.boundingBox.min.x);

	material = Physijs.createMaterial(
		new THREE.MeshPhongMaterial({
			color: Math.random() * 0xffffff,
			overdraw: 0.5
		}),
		0.9,
		0.9
	);

	txt = new Physijs.ConcaveMesh(
		text_geometry,
		material
	);
	txt.collisions = 0;
	txt.setCcdMotionThreshold(1);

	// txt.position.set(
	// 	Math.random() * 15 - 7.5, -30,
	// 	Math.random() * 15 - 7.5
	// );

	txt.position.set(
		Math.random() * 15 - 7.5,
		-50,
		Math.random() * 15 - 7.5
	);	

	txt.rotation.set(
		(Math.random() * Math.PI)/2,
		0,
		Math.random() * Math.PI
	);

	txt.rotateOnAxis(new THREE.Vector3(0,0,0), 90);

	txt.castShadow = true;

	scene.add(txt);

	newMessage = "";
	isNewMessage = false;
}

spawnBox = (function() {
	var box_geometry = new THREE.BoxGeometry(4, 4, 4),

		handleCollision = function(collided_with, linearVelocity, angularVelocity) {
			switch (++this.collisions) {

				case 1:
					this.material.color.setHex(0xcc8855);
					break;

				case 2:
					this.material.color.setHex(0xbb9955);
					break;

				case 3:
					this.material.color.setHex(0xaaaa55);
					break;

				case 4:
					this.material.color.setHex(0x99bb55);
					break;

				case 5:
					this.material.color.setHex(0x88cc55);
					break;

				case 6:
					this.material.color.setHex(0x77dd55);
					break;
			}
		},
		createBox = function() {
			var box, material;

			material = Physijs.createMaterial(
				new THREE.MeshLambertMaterial({
					map: THREE.ImageUtils.loadTexture('images/plywood.jpg')
				}),
				0.6, // medium friction
				0.3 // low restitution
			);
			material.map.wrapS = material.map.wrapT = THREE.RepeatWrapping;
			material.map.repeat.set(.5, .5);

			//material = new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture( 'images/rocks.jpg' ) });

			box = new Physijs.BoxMesh(
				box_geometry,
				material
			);
			box.collisions = 0;

			box.position.set(
				Math.random() * 15 - 7.5,
				25,
				Math.random() * 15 - 7.5
			);

			box.rotation.set(
				Math.random() * Math.PI,
				Math.random() * Math.PI,
				Math.random() * Math.PI
			);

			box.castShadow = true;
			box.addEventListener('collision', handleCollision);
			box.addEventListener('ready', spawnBox);
			// box.visible = false;
			box.name = "test";
			scene.add(box);

			var text_geometry = new THREE.TextGeometry("h", {
				size: 5,
				height: 3,
				curveSegments: 4,
				font: "helvetiker"
			});
			text_geometry.computeBoundingBox();

			var txt, mat;

			var centerOffset = -0.5 *
				(text_geometry.boundingBox.max.x -
					text_geometry.boundingBox.min.x);

			mat = new THREE.MeshBasicMaterial({
				color: Math.random() * 0xffffff,
				overdraw: 0.5
			});

			txt = new THREE.Mesh(text_geometry, mat);

			txt.position.set(
				box.position.x,
				box.position.y,
				box.position.z
			);

			txt.rotation.set(
				box.rotation.x,
				box.rotation.y,
				box.rotation.z
			);
			txt.castShadow = true;
			txt.name = "test2";
			scene.add(txt);
		};

	return function() {
		setTimeout(createBox, 2000);
	};
})();

render = function() {
	requestAnimationFrame(render);

	if (isNewMessage == true)
		spawnText(newMessage);

	renderer.render(scene, camera);
};

window.onload = initScene;