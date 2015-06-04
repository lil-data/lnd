/**
 * Leonard Nimoy Da Voronoici
 *
 * Creates a server-client based interactive voronoi diagram
 *
 */

(function(window) {

  var Touch = function(domElement) {

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.needsUpdate = false;
    this.tempVector = new THREE.Vector3();

    this.isTouching = false;

    // init users
    this.users = {};

    // init heroku socket and callbacks
    var that = this;
    this.socket = io('/touch');

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

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 100000);
    this.camera.position.z = 2000;
    this.scene = new THREE.Scene();

    // some drawing setup

    // init renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: false
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xFFFF00);
    // this.renderer.autoClear = false;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    domElement.getElementById('container').appendChild(this.renderer.domElement);

    // mouse listeners
    domElement.body.addEventListener('mousemove',
      function(event) {
        event.preventDefault();
        that.user_position_updated(event.clientX, event.clientY);
      },
      false);

    domElement.body.addEventListener('touchstart',
      function(event) {
        event.preventDefault();
        this.isTouching = true;
        console.log(this.isTouching);
        that.user_position_updated(event.touches[0].pageX, event.touches[0].pageY);
      },
      false);

    domElement.body.addEventListener('touchmove',
      function(event) {
        event.preventDefault();
        this.isTouching = true;
        console.log(this.isTouching);
        that.user_position_updated(event.touches[0].pageX, event.touches[0].pageY);
      },
      false);

    domElement.body.addEventListener('touchend',
      function(event) {
        event.preventDefault();
        this.isTouching = false;
        console.log(this.isTouching);
        // that.user_position_updated(event.touches[0].pageX, event.touches[0].pageY);
      },
      false);
  };

  Touch.prototype.server_on_connection = function(users, userId) {
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
      this.create_touch(u, this.users[u]);
    }
  };

  Touch.prototype.server_user_added = function(userId, user) {
    console.log('Server: user', userId, 'added at', user.x, user.y, this.users);
    this.users[userId] = {
      x: user.x,
      y: user.y,
      img: user.img
    };
    this.create_touch(userId, this.users[userId]);
    this.needsUpdate = true;
  };

  Touch.prototype.server_user_removed = function(userId) {
    console.log('Server: user', userId, 'removed', this.users);

    delete this.users[userId];
    this.scene.remove(this.scene.getObjectByName(userId));
  };

  Touch.prototype.server_user_updated = function(userId, user) {
    // console.log('Server: user', userId, 'updated', user.x, user.y);
    this.users[userId].x = user.x;
    this.users[userId].y = user.y;
    this.users[userId].img = user.img;
    this.needsUpdate = true;
  };

  Touch.prototype.client_user_updated = function() {
    this.socket.emit('userDidUpdate', this.id, this.users[this.id]);
  };

  Touch.prototype.user_position_updated = function(canvasX, canvasY) {
    // server could not be connected
    if (this.users[this.id]) {

      var sceneX = (canvasX/this.width)*2 - 1;
      var sceneY = 1 - 2*(canvasY/this.height);

      this.users[this.id].x = sceneX;
      this.users[this.id].y = sceneY;
      this.client_user_updated();
    }
  };
  
  Touch.prototype.convert_canvas_coords_to_scene = function(x, y) {
    this.tempVector.set(x, y, 0.5);
    this.tempVector.unproject(this.camera);
    this.tempVector.sub(this.camera.position);
    var dir = this.tempVector.normalize();
    var distance = -this.camera.position.z / dir.z;
    return this.camera.position.clone().add(dir.multiplyScalar(distance));
  };

  Touch.prototype.create_touch = function(id, user) {
    var mat;
    if(id == this.id) {
      var finger   = THREE.ImageUtils.loadTexture("./img/fingsq.png");
      mat = new THREE.MeshBasicMaterial( { map: finger, transparent: true } );
    } else {
      var finger2  = THREE.ImageUtils.loadTexture("./img/tipsq.png");
      mat = new THREE.MeshBasicMaterial( { map: finger2, transparent: true } );
    }
    var geom     = new THREE.PlaneBufferGeometry( 4000, 4000 );
    var mesh     = new THREE.Mesh(geom, mat);
    mesh.name = id;
    mesh.position.x = user.x+20;
    mesh.position.y = user.y-90;
    if(id == this.id) {
      mesh.position.z = 2;
    } else {
      mesh.position.z = Math.random();
    }
    mesh.scale.x = mesh.scale.y = mesh.scale.z = 1;
    this.scene.add(mesh);
    // this.spheres.push(mesh);
  };

  Touch.prototype.update_touches = function(id, user) {
    var t = this.scene.getObjectByName(id);
    var sceneCoords = this.convert_canvas_coords_to_scene(user.x, user.y);

    var v = sceneCoords.clone();
    v.sub(t.position);
    v.multiplyScalar(0.05);
    if(id == this.id) {
      v.x += 20;
      v.y -= 90;
      v.z  = 0;
    } else {
      v.x += 20;
      v.y += 90;
      v.z  = 0; 
    }
    t.position.add(v);

    t.rotation.z = (user.y + user.x) * 2;

  };

  Touch.prototype.render = function() {
    this.renderer.render(this.scene, this.camera);
  };

  Touch.prototype.update = function() {
      for (var u in this.users) {
        this.update_touches(u, this.users[u]);
      }
  };

  window.Touch = Touch;

})(window);