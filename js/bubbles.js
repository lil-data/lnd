/**
 * Leonard Nimoy Da Voronoici
 *
 * Creates a server-client based interactive voronoi diagram
 *
 */

(function(window) {

  var Bubbles = function(domElement) {

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // init users
    this.users = {};

    // init heroku socket and callbacks
    var that = this;
    this.socket = io('https://lnd.herokuapp.com/bub');

    this.socket.on('initUser', function(users, userId) {
      that.server_on_connection(users, userId);
    });

    this.socket.on('userDidInit', function(userId, user) {
      that.server_user_added(userId, user);
    });

    this.socket.on('userDidDisconnect', function(userId) {
      that.server_user_removed(userId);
    });

    this.socket.on('userDidUpdate', function(userId, user) {
      that.server_user_updated(userId, user);
    });

    this.spheres = [];
    this.mouseX = 0;
    this.mouseY = 0;

    // init scene
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 100000);
    this.camera.position.z = 3200;
    this.cameraCube = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 100000);
    this.scene = new THREE.Scene();
    this.sceneCube = new THREE.Scene();
    this.geometry = new THREE.SphereGeometry(100, 32, 16);
    var path = "img/bubbles/";
    var format = '.jpg';
    var urls = [
      path + 'posx' + format, path + 'negx' + format,
      path + 'posy' + format, path + 'negy' + format,
      path + 'posz' + format, path + 'negz' + format
    ];
    this.textureCube = THREE.ImageUtils.loadTextureCube(urls);
    this.textureCube.format = THREE.RGBFormat;
    this.shader = THREE.FresnelShader;
    this.uniforms = THREE.UniformsUtils.clone(this.shader.uniforms);
    this.uniforms["tCube"].value = this.textureCube;
    this.parameters = {
      fragmentShader: this.shader.fragmentShader,
      vertexShader: this.shader.vertexShader,
      uniforms: this.uniforms
    };
    this.material = new THREE.ShaderMaterial(this.parameters);
    this.scene.matrixAutoUpdate = false;
    // Skybox
    this.skyshader = THREE.ShaderLib["cube"];
    this.skyshader.uniforms["tCube"].value = this.textureCube;
    this.skymaterial = new THREE.ShaderMaterial({
      fragmentShader: this.skyshader.fragmentShader,
      vertexShader: this.skyshader.vertexShader,
      uniforms: this.skyshader.uniforms,
      side: THREE.BackSide
    });
    var skymesh = new THREE.Mesh(new THREE.BoxGeometry(100000, 100000, 100000), this.skymaterial);
    this.sceneCube.add(skymesh);

    // init renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: false
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000);
    this.renderer.autoClear = false;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    domElement.getElementById('canvascontainer').appendChild(this.renderer.domElement);

    // mouse listeners
    domElement.body.addEventListener('mousemove',
      function(event) {
        event.preventDefault();
        that.user_position_updated(
          event.clientX - (that.width / 2), (that.height / 2) - event.clientY);
        this.mouseX = (event.clientX - (this.width / 2)) * 10;
        this.mouseY = (event.clientY - (this.height / 2)) * 10;
      },
      false);

    domElement.body.addEventListener('ontouchstart', function(event) {
      event.preventDefault();
      that.user_position_updated(
        event.touches[0].pageX - (that.width / 2), (that.height / 2) - event.touches[0].pageY);
    }, false);

    domElement.body.addEventListener('touchmove', function(event) {
      event.preventDefault();
      that.user_position_updated(
        event.touches[0].pageX - (that.width / 2), (that.height / 2) - event.touches[0].pageY);
    }, false);
  };

  Bubbles.prototype.server_on_connection = function(users, userId) {
    console.log('Server: connected', users, userId);

    // add self to users object
    this.id = userId;
    this.users = users;
    this.users[this.id] = {
      x: 0,
      y: 0,
      img: false
    };

    // notify server
    this.socket.emit('userDidInit', this.id, this.users[this.id]);

    for (var u in this.users) {
      console.log(u, this.users[u]);
      this.create_sphere(u, this.users[u]);
    }
  };

  Bubbles.prototype.server_user_added = function(userId, user) {
    console.log('Server: user', userId, 'added at', user.x, user.y, this.users);
    this.users[userId] = {
      x: user.x,
      y: user.y,
      img: user.img
    };
    this.create_sphere(userId, this.users[userId]);
  };

  Bubbles.prototype.server_user_removed = function(userId) {
    console.log('Server: user', userId, 'removed', this.users);
    delete this.users[userId];
    delete this.scene.getObjectByName(userId);
  };

  Bubbles.prototype.server_user_updated = function(userId, user) {
    // console.log('Server: user', userId, 'updated', user.x, user.y);
    this.users[userId].x = user.x;
    this.users[userId].y = user.y;
    this.users[userId].img = user.img;
  };

  Bubbles.prototype.client_user_updated = function() {
    this.socket.emit('userDidUpdate', this.id, this.users[this.id]);
  };

  Bubbles.prototype.user_position_updated = function(x, y) {
    this.users[this.id].x = x;
    this.users[this.id].y = y;
    this.client_user_updated();
  };

  Bubbles.prototype.create_sphere = function(id, user) {
    var mesh = new THREE.Mesh(this.geometry, this.material);
    mesh.name = id;
    mesh.position.x = user.x;
    mesh.position.y = user.y;
    mesh.position.z = 1000;
    mesh.scale.x = mesh.scale.y = mesh.scale.z = 3;
    this.scene.add(mesh);
    this.spheres.push(mesh);
  };

  Bubbles.prototype.update_spheres = function(id, user) {
    var current = {
      x: this.scene.getObjectByName(id).position.x,
      y: this.scene.getObjectByName(id).position.y
    };
    this.scene.getObjectByName(id).position.x = user.x*2;
    this.scene.getObjectByName(id).position.y = user.y*2;
  };

  Bubbles.prototype.render = function() {
    this.timer = 0.0001 * Date.now();
    this.camera.position.x += (this.mouseX - this.camera.position.x) * .05;
    this.camera.position.y += (-this.mouseY - this.camera.position.y) * .05;
    this.camera.lookAt(this.scene.position);
    this.cameraCube.rotation.copy(this.camera.rotation);
    this.renderer.clear();
    this.renderer.render(this.sceneCube, this.cameraCube);
    this.renderer.render(this.scene, this.camera);
  };

  Bubbles.prototype.update = function() {
    // how to give this momentum?
    for (var u in this.users) {
      this.update_spheres(u, this.users[u]);
    }
  };

  window.Bubbles = Bubbles;

})(window);