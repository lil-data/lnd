/**
 * Leonard Nimoy Da Voronoici
 *
 * Creates a server-client based interactive voronoi diagram
 *
 */

(function(domElement) {

  var Leonard = function() {
    // init scene
    this.scene = new THREE.Scene();

    // init renderer
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    domElement.document.body.appendChild(this.renderer.domElement);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0xaaaaaa);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // init camera
    this.camera = new THREE.PerspectiveCamera(45, (window.innerWidth/window.innerHeight), 1, 10000);
    this.camera.position.set(0, 150, 500);
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
    var width = domElement.innerWidth/2;
    var height = domElement.innerHeight;
    this.vorbox = {xl: -domElement.innerWidth/2, xr: domElement.innerWidth/2, yt: 0, yb: height}; // size of diagram

    // init users
    this.users = {};

    // init heroku socket and callbacks
    var that = this;
    this.socket = io('https://lnd.herokuapp.com/');

    this.socket.on('initUser', function(userId, users) {
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
    this.users[userId] = {x: 100, y: 100, img: false};

    // notify server
    this.socket.emit('userDidInit', this.id, this.users[this.id]);
  };

  Leonard.prototype.server_user_added = function(userId, user) {
    console.log('Server: user', userId, 'added at', user.x, user.y);
    this.users[userId] = {x: user.x, y: user.y, img: user.img};
  };

  Leonard.prototype.server_user_removed = function(userId) {
    console.log('Server: user', userId, 'removed');
    delete this.users[userId];
  };

  Leonard.prototype.server_user_updated = function(userId, user) {
    console.log('Server: user', userId, 'updated');
    this.users[userId].x = user.x;
    this.users[userId].y = user.y;
    this.users[userId].img = user.img;
  };

  Leonard.prototype.client_user_updated = function() {
    console.log('update client');
    this.socket.emit('userDidUpdate', self.id, self.users[self.id]);
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
    // console.log("voronoi updated", this.pointCloud.geometry.vertices);
  };

  Leonard.prototype.render = function() {
    this.renderer.render(this.scene, this.camera);
  };

  Leonard.prototype.update = function() {
    this.update_voronoi();
  };

  window.Leonard = Leonard;

})(window);