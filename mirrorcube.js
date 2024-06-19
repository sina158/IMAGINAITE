const SKYBOX_IMG = 'https://github.com/sina158/IMAGINAITE/blob/3b4855f13204f36552c73bfca524b80f66af31e7/background.jpg;

class App {
  constructor() {
    this._bind('_render', '_resize');
    this._setup();
    this._createScene();
    window.addEventListener('resize', this._resize);
  }

  _bind(...methods) {
    methods.forEach(method => this[method] = this[method].bind(this));
  }

  _setup() {
    this._renderer = new THREE.WebGLRenderer({ antialias: true });
    this._renderer.setSize(window.innerWidth, window.innerHeight);
    this._renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('mirrorcube').appendChild(this._renderer.domElement);

    this._scene = new THREE.Scene();
    this._camera = new MousePerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this._camera.position.set(100, 100, 100);
  }

  _createScene() {
    const light = new THREE.PointLight(0xffffff);
    light.position.set(100, 100, 100);
    this._scene.add(light);

    const skybox = new Skybox([1024, 1024, 1024], [
      SKYBOX_IMG,
      SKYBOX_IMG,
      SKYBOX_IMG,
      SKYBOX_IMG,
      SKYBOX_IMG,
      SKYBOX_IMG
    ]);
    this._scene.add(skybox);

    const reflectionCube = new ReflectionCube([30, 30, 30], skybox._texture);
    reflectionCube.position.set(0, 0, 0);

    const socialCube = new SocialCube([31, 31, 31], this._renderer, this._camera);
    socialCube.position.set(0, 0, 0);

    this._cube = new SpinnableObject(reflectionCube, socialCube);
    this._scene.add(this._cube);
  }

  _render() {
    this._renderer.render(this._scene, this._camera);
    this._camera._update();
    if (this._cube) this._cube._update();
    requestAnimationFrame(this._render);
  }

  _resize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

class SpinnableObject extends THREE.Object3D {
  constructor(...assets) {
    super();
    this._bind('_handleActionStart', '_handleActionMove', '_handleActionEnd');
    this._rotationSpeed = 2;
    this._moveReleaseTimeDelta = 50;
    this._actionOn = false;
    this._deltaX = 0;
    this._deltaY = 0;
    this._lastMoveTimestamp = new Date();
    this._rotateStartPoint = new THREE.Vector3(0, 0, 1);
    this._rotateEndPoint = new THREE.Vector3(0, 0, 1);
    this._startPoint = { x: 0, y: 0 };

    assets.forEach(asset => this.add(asset));

    document.addEventListener('mousedown', this._handleActionStart, false);
    document.addEventListener('touchstart', this._handleActionStart, false);
  }

  _bind(...methods) {
    methods.forEach(method => this[method] = this[method].bind(this));
  }

  _handleActionStart(e) {
    const action = e.type === 'touchstart' ? {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    } : {
      x: e.clientX,
      y: e.clientY
    };

    e.preventDefault();
    document.addEventListener('mousemove', this._handleActionMove, false);
    document.addEventListener('touchmove', this._handleActionMove, false);
    document.addEventListener('mouseup', this._handleActionEnd, false);
    document.addEventListener('touchend', this._handleActionEnd, false);

    this._actionOn = true;
    this._startPoint = { x: action.x, y: action.y };
    this._rotateStartPoint = this._rotateEndPoint = this._projectOnTrackball(0, 0);
  }

  _handleActionMove(e) {
    const action = e.type === 'touchmove' ? {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    } : {
      x: e.clientX,
      y: e.clientY
    };

    e.preventDefault();
    this._deltaX = action.x - this._startPoint.x;
    this._deltaY = action.y - this._startPoint.y;
    this._handleRotation();
    this._startPoint = { x: action.x, y: action.y };
    this._lastMoveTimestamp = new Date();
  }

  _handleActionEnd(e) {
    const action = e.type === 'touchend' && e.touches.length > 0 ? {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    } : {
      x: e.clientX,
      y: e.clientY
    };

    e.preventDefault();
    if (new Date().getTime() - this._lastMoveTimestamp.getTime() > this._moveReleaseTimeDelta) {
      this._deltaX = action.x - this._startPoint.x;
      this._deltaY = action.y - this._startPoint.y;
    }

    this._actionOn = false;
    document.removeEventListener('mousemove', this._handleActionMove, false);
    document.removeEventListener('touchmove', this._handleActionMove, false);
    document.removeEventListener('mouseup', this._handleActionEnd, false);
    document.removeEventListener('touchend', this._handleActionEnd, false);
  }

  _projectOnTrackball(touchX, touchY) {
    const mouseOnBall = new THREE.Vector3(
      this._clamp(touchX / (window.innerWidth / 2), -1, 1),
      this._clamp(-touchY / (window.innerHeight / 2), -1, 1),
      0.0
    );

    const length = mouseOnBall.length();
    if (length > 1.0) {
      mouseOnBall.normalize();
    } else {
      mouseOnBall.z = Math.sqrt(1.0 - length * length);
    }

    return mouseOnBall;
  }

  _rotateMatrix(rotateStart, rotateEnd) {
    const axis = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    let angle = Math.acos(rotateStart.dot(rotateEnd) / rotateStart.length() / rotateEnd.length());

    if (angle) {
      axis.crossVectors(rotateStart, rotateEnd).normalize();
      angle *= this._rotationSpeed;
      quaternion.setFromAxisAngle(axis, angle);
    }
    return quaternion;
  }

  _handleRotation() {
    this._rotateEndPoint = this._projectOnTrackball(this._deltaX, this._deltaY);
    const rotateQuaternion = this._rotateMatrix(this._rotateStartPoint, this._rotateEndPoint);
    this.quaternion.multiplyQuaternions(rotateQuaternion, this.quaternion).normalize();
    this._rotateEndPoint = this._rotateStartPoint;
  }

  _clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  _update() {
    if (!this._actionOn) {
      const drag = 0.95;
      const minDelta = 0.05;

      if (Math.abs(this._deltaX) > minDelta) {
        this._deltaX *= drag;
      } else {
        this._deltaX = 0;
      }

      if (Math.abs(this._deltaY) > minDelta) {
        this._deltaY *= drag;
      } else {
        this._deltaY = 0;
      }

      this._handleRotation();
    }
  }
}

class SocialCube extends THREE.Object3D {
  constructor(size, renderer, camera) {
    super();
    this._bind('_handleActionStart', '_handleMouseMove', '_handleActionEnd', '_unbindSocial');

    this._camera = camera;
    this._mouse = new THREE.Vector2();
    this._raycaster = new THREE.Raycaster();
    this._renderer = renderer;

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('');

    const materials = [];
    for (let i = 0; i < size.length; i++) {
      loader.load(size[i], (t) => {
        t.offset.set(-0.5, -0.5);
        t.repeat.set(2, 2);
        const face = new THREE.MeshBasicMaterial({ map: t, transparent: true });
        face.map.needsUpdate = true;
        materials[i] = face;

        if (i === (size.length - 1)) {
          this._material = new THREE.MultiMaterial(materials);
          this._geometry = new THREE.CubeGeometry(size[0], size[1], size[2]);
          this._mesh = new THREE.Mesh(this._geometry, this._material);
          this._mesh.doubleSided = true;
          this.add(this._mesh);

          document.addEventListener('touchstart', this._handleActionStart, false);
          document.addEventListener('mousedown', this._handleActionStart, false);
          document.addEventListener('mousemove', this._handleMouseMove, false);
        }
      });
    }
  }

  _bind(...methods) {
    methods.forEach(method => this[method] = this[method].bind(this));
  }

  _getIntersects(x, y) {
    this._mouse.x = (x / this._renderer.domElement.clientWidth) * 2 - 1;
    this._mouse.y = -(y / this._renderer.domElement.clientHeight) * 2 + 1;
    this._raycaster.setFromCamera(this._mouse, this._camera);
    return this._raycaster.intersectObject(this._mesh);
  }

  _handleActionStart(e) {
    const action = e.type === 'touchstart' ? {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    } : {
      x: e.clientX,
      y: e.clientY
    };

    const intersects = this._getIntersects(action.x, action.y);
    if (intersects.length > 0) {
      this._bindSocial();
      setTimeout(this._unbindSocial, 1400);
    }
  }

  _handleActionEnd(e) {
    const action = e.type === 'touchend' && e.touches.length > 0 ? {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    } : {
      x: e.clientX,
      y: e.clientY
    };

    const intersects = this._getIntersects(action.x, action.y);
    this._fireLink(intersects);
  }

  _fireLink(intersects) {
    if (intersects.length > 0) {
      const index = intersects[0].face.materialIndex;
      if (index >= 0 && index < this._social.length) {
        window.open(this._social[index].link, '_blank', '', '');
      }
    }
    this._unbindSocial();
  }

  _handleMouseMove(e) {
    e.preventDefault();
    const intersects = this._getIntersects(e.clientX, e.clientY);
    document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'move';
  }

  _bindSocial() {
    document.addEventListener('mouseup', this._handleActionEnd, false);
    document.addEventListener('touchend', this._handleActionEnd, false);
    document.addEventListener('mousemove', this._unbindSocial, false);
    document.addEventListener('touchmove', this._unbindSocial, false);
  }

  _unbindSocial() {
    document.removeEventListener('mouseup', this._handleActionEnd, false);
    document.removeEventListener('touchend', this._handleActionEnd, false);
    document.removeEventListener('mousemove', this._unbindSocial, false);
  }
}

class ReflectionCube extends THREE.Object3D {
  constructor(size, reflect) {
    super();
    this._material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: false,
      envMap: reflect,
      refractionRatio: 0.8,
    });

    this._geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
    this._mesh = new THREE.Mesh(this._geometry, this._material);
    this.add(this._mesh);
  }
}

class Skybox extends THREE.Object3D {
  constructor(size, images) {
    super();

    const loader = new THREE.CubeTextureLoader();
    loader.setCrossOrigin('');

    this._texture = loader.load(images, (t) => {
      t.format = THREE.RGBFormat;
      t.mapping = THREE.CubeRefractionMapping;

      const shader = THREE.ShaderLib['cube'];
      shader.uniforms['tCube'].value = t;

      this._geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);

      this._material = new THREE.ShaderMaterial({
        fragmentShader: shader.fragmentShader,
        vertexShader: shader.vertexShader,
        uniforms: shader.uniforms,
        depthWrite: false,
        side: THREE.BackSide,
      });

      this._mesh = new THREE.Mesh(this._geometry, this._material);
      this.add(this._mesh);
    });
  }
}

class MousePerspectiveCamera extends THREE.PerspectiveCamera {
  constructor(...args) {
    super(...args);
    this._mouseX = 0;
    this._mouseY = 0;
    document.addEventListener('mousemove', this._handleMouseMove.bind(this), false);
  }

  _handleMouseMove(e) {
    e.preventDefault();
    this._mouseX = (e.clientX - window.innerWidth / 2) * 0.05;
    this._mouseY = (e.clientY - window.innerHeight / 2) * 0.05;
  }

  _update() {
    this.position.x += (this._mouseX - this.position.x) * 0.015;
    this.position.y += (-this._mouseY - this.position.y) * 0.015;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app._render();
});
