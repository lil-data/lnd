/**
 * Leonard Nimoy Da Voronoici
 *
 * Creates a server-client based interactive voronoi diagram
 *
 */

(function(window) {

  var Leonard = function(domElement) {

    this.width = domElement.body.clientWidth;
    this.height = 500;//domElement.body.clientHeight;

    // init scene
    this.scene = new THREE.Scene();
    this.lines = [];

    var lineMat = new THREE.LineBasicMaterial({color: 0xffffff});

    var geomX = new THREE.Geometry();
    geomX.vertices.push(new THREE.Vector3(-this.width/2, 0, 0 ), new THREE.Vector3(this.width/2, 0, 0));
    this.scene.add(new THREE.Line(geomX, lineMat));

    var geomY = new THREE.Geometry();
    geomY.vertices.push(new THREE.Vector3(0, -this.height/2, 0 ), new THREE.Vector3(0, this.height/2, 0));
    this.scene.add(new THREE.Line(geomY, lineMat));

    // init renderer
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    domElement.body.appendChild(this.renderer.domElement);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xcccccc);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // init camera
    this.camera = new THREE.PerspectiveCamera(45, (this.width/this.height), 1, 10000);
    this.camera.position.set(0, 0, 500);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    // init geometry
    this.pointCloud = new THREE.PointCloud(
      new THREE.Geometry(),
      new THREE.PointCloudMaterial({
        color: 0xffffff,
        vertexColors: THREE.VertexColors,
        size: 10}));

    // init voronoi
    this.voronoi = new Voronoi();
    this.vorbox = {xl: -this.width/2, xr: this.width/2, yt: -this.height/2, yb: this.height/2}; // size of diagram

    // init users
    this.users = {};

    // mouse listeners
    domElement.body.addEventListener('mousemove',
      function(event) {
        that.user_position_updated(event.clientX-(that.width/2), (that.height/2)-event.clientY);
      },
      false);

    // init heroku socket and callbacks
    var that = this;
    this.socket = io('https://lnd.herokuapp.com/');

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
      that.server_user_updated(userId, user)
    });
  };

  Leonard.prototype.server_on_connection = function(users, userId) {
    console.log('Server: connected', users, userId);

    // add self to users object
    this.id = userId;
    this.users = users;
    this.users[this.id] = {x: 0, y: 0, img: false};

    // notify server
    this.socket.emit('userDidInit', this.id, this.users[this.id]);
  };

  Leonard.prototype.server_user_added = function(userId, user) {
    console.log('Server: user', userId, 'added at', user.x, user.y, this.users);
    this.users[userId] = {x: user.x, y: user.y, img: user.img};
  };

  Leonard.prototype.server_user_removed = function(userId) {
    console.log('Server: user', userId, 'removed', this.users);
    delete this.users[userId];
  };

  Leonard.prototype.server_user_updated = function(userId, user) {
    // console.log('Server: user', userId, 'updated', user.x, user.y);
    this.users[userId].x = user.x;
    this.users[userId].y = user.y;
    this.users[userId].img = user.img;
  };

  Leonard.prototype.client_user_updated = function() {
    this.socket.emit('userDidUpdate', this.id, this.users[this.id]);
  };

  Leonard.prototype.user_position_updated = function(x, y) {
    this.users[this.id].x = x;
    this.users[this.id].y = y;
    this.client_user_updated();
  };

  Leonard.prototype.update_voronoi = function() {
    if (this.vordiagram) this.voronoi.recycle(this.vordiagram);

    // create voronoi 'sites' from user info
    var sites = [];
    for (var id in this.users) {
      if (!this.users.hasOwnProperty(id)) continue;
      sites.push({x: this.users[id].x, y: this.users[id].y});
    }

    // update voronoi calculation
    this.vordiagram = this.voronoi.compute(sites, this.vorbox);

    // update geometry
    this.scene.remove(this.pointCloud);
    var geometry = new THREE.Geometry();
    for (var c in this.vordiagram.cells) {
        geometry.vertices.push(new THREE.Vector3(
            this.vordiagram.cells[c].site.x,
            this.vordiagram.cells[c].site.y,
            0.0));
    }
    var material = new THREE.PointCloudMaterial({
        color: 0xffffff,
        vertexColors: THREE.VertexColors,
        size: 10});
    this.pointCloud = new THREE.PointCloud(geometry, material);
    this.scene.add(this.pointCloud);

    // remove previous lines
    for (var i = 0; i < this.lines.length; ++i) {
      this.scene.remove(this.lines[i]);
    }
    this.lines.length = 0;

    // add voronoi edges
    var lineMat = new THREE.LineBasicMaterial({color: 0xffffff, linewidth: 20});
    for (var e in this.vordiagram.edges) {
        var edge = this.vordiagram.edges[e];
        var shapeGeom = new THREE.Geometry();
        shapeGeom.vertices.push(new THREE.Vector3(edge.va.x, edge.va.y, 0));
        shapeGeom.vertices.push(new THREE.Vector3(edge.vb.x, edge.vb.y, 0));

        var line = new THREE.Line(shapeGeom, lineMat);
        this.lines.push(line);
        this.scene.add(line);
    }
  };

  Leonard.prototype.render = function() {
    this.renderer.render(this.scene, this.camera);
  };

  Leonard.prototype.update = function() {
    this.update_voronoi();
  };

  window.Leonard = Leonard;

})(window);