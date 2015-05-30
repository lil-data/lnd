/**
 * Leonard Nimoy Da Voronoici
 *
 * Creates a server-client based interactive voronoi diagram
 *
 */

(function(window) {

  var Leonard = function(domElement) {

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // init scene
    this.scene = new THREE.Scene();
    this.lines = [];
    this.cellGeoms = [];
    this.cellMeshes = [];

    // init renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    domElement.getElementById('canvascontainer').appendChild(this.renderer.domElement);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // init camera
    this.camera = new THREE.PerspectiveCamera(45, (this.width / this.height), 1, 10000);
    this.camera.position.set(0, 0, 500);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    // init voronoi
    this.voronoi = new Voronoi();
    this.vorbox = {
      xl: -this.width / 2,
      xr: this.width / 2,
      yt: -this.height / 2,
      yb: this.height / 2
    }; // size of diagram

    // init users
    this.users = {};

    // mouse listeners
    domElement.body.addEventListener('mousemove',
      function(event) {
        event.preventDefault();
        that.user_position_updated(
          event.clientX - (that.width / 2), (that.height / 2) - event.clientY);
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

    // init heroku socket and callbacks
    var that = this;
    this.socket = io();

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
    this.users[this.id] = {
      x: 0,
      y: 0,
      img: false
    };

    // notify server
    this.socket.emit('userDidInit', this.id, this.users[this.id]);
  };

  Leonard.prototype.server_user_added = function(userId, user) {
    console.log('Server: user', userId, 'added at', user.x, user.y, this.users);
    this.users[userId] = {
      x: user.x,
      y: user.y,
      img: user.img
    };
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
      sites.push({
        x: this.users[id].x,
        y: this.users[id].y
      });
    }

    // update voronoi calculation
    this.vordiagram = this.voronoi.compute(sites, this.vorbox);

    // remove previous cell shapes
    for (var i = 0; i < this.cellMeshes.length; ++i) {
      this.scene.remove(this.cellMeshes[i]);
      this.cellMeshes[i].geometry.dispose();
      this.cellMeshes[i].material.dispose();
    }
    this.cellMeshes.length = 0;
    this.cellGeoms.length = 0;
    // create cell shapes from cells and add to scene
    for (var v in this.vordiagram.cells) {
      var cell = this.vordiagram.cells[v];
      var cellShape = new THREE.Shape();
      for (var h in cell.halfedges) {
        var halfedge = cell.halfedges[h];
        var start = halfedge.getStartpoint();
        if (h == 0) {
          cellShape.moveTo(start.x, start.y);
        } else if (h === cell.halfedges.length) {
          var end = halfedge.getEndpoint();
          cellShape.lineTo(start.x, start.y);
          cellShape.lineTo(end.x, end.y);
        } else {
          cellShape.lineTo(start.x, start.y);
        }
      }
      this.cellGeoms.push(new THREE.ShapeGeometry(cellShape));
    }
    var l = Object.keys(this.cellGeoms).length;
    for (var g in this.cellGeoms) {
      this.cellMeshes[g] = new THREE.Mesh(this.cellGeoms[g], new THREE.MeshBasicMaterial({
        color: g/l * 0xffffff
      }));
      this.scene.add(this.cellMeshes[g]);
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