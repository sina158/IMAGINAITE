const SKYBOX_IMG = 'https://uploads-ssl.webflow.com/61e1a061b07c61ff1770ca68/61e466244c945f70c520149d_masahiro-miyagi-hi9ZNs7EY3c-unsplash-2.jpg';

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
    this._camera = new MousePerspectiveCamera(
      45, window.innerWidth / window.innerHeight, 0.1, 1000
    );
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
        this
