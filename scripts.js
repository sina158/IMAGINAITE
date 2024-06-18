// Three.js Library
const threeJsScript = document.createElement('script');
threeJsScript.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r125/three.min.js";
document.head.appendChild(threeJsScript);

// Initial Setup Script
window.AnimateText = 'IMAGINAITE';

class CreateParticles {
    constructor(scene, font, particleImg, camera, renderer) {
        this.scene = scene;
        this.font = font;
        this.particleImg = particleImg;
        this.camera = camera;
        this.renderer = renderer;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2(-200, 200);
        this.colorChange = new THREE.Color();
        this.buttom = false;
        this.data = {
            text: window.AnimateText,
            textColor: 0xffffff,
            amount: 1500,
            particleSize: 1,
            particleColor: 0xffffff,
            textSize: 16,
            area: 250,
            ease: .05,
        };
        this.setup();
        this.bindEvents();
    }

    setup() {
        const geometry = new THREE.PlaneGeometry(this.visibleWidthAtZDepth(100, this.camera), this.visibleHeightAtZDepth(100, this.camera));
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true });
        this.planeArea = new THREE.Mesh(geometry, material);
        this.planeArea.visible = false;
        this.createText();
    }

    bindEvents() {
        document.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
    }

    onMouseDown(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        const vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 0.5);
        vector.unproject(this.camera);
        const dir = vector.sub(this.camera.position).normalize();
        const distance = -this.camera.position.z / dir.z;
        this.currenPosition = this.camera.position.clone().add(dir.multiplyScalar(distance));
        this.buttom = true;
        this.data.ease = .01;
    }

    onMouseUp() {
        this.buttom = false;
        this.data.ease = .05;
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    render() {
        const time = ((.001 * performance.now()) % 12) / 12;
        const zigzagTime = (1 + (Math.sin(time * 2 * Math.PI))) / 6;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.planeArea);
        if (intersects.length > 0) {
            const pos = this.particles.geometry.attributes.position;
            const copy = this.geometryCopy.attributes.position;
            const coulors = this.particles.geometry.attributes.customColor;
            const size = this.particles.geometry.attributes.size;
            const mx = intersects[0].point.x;
            const my = intersects[0].point.y;
            const mz = intersects[0].point.z;
            for (let i = 0, l = pos.count; i < l; i++) {
                const initX = copy.getX(i);
                const initY = copy.getY(i);
                const initZ = copy.getZ(i);
                let px = pos.getX(i);
                let py = pos.getY(i);
                let pz = pos.getZ(i);
                this.colorChange.setHSL(.5, 1, 1);
                coulors.setXYZ(i, this.colorChange.r, this.colorChange.g, this.colorChange.b);
                coulors.needsUpdate = true;
                size.array[i] = this.data.particleSize;
                size.needsUpdate = true;
                let dx = mx - px;
                let dy = my - py;
                const dz = mz - pz;
                const mouseDistance = this.distance(mx, my, px, py);
                let d = (dx = mx - px) * dx + (dy = my - py) * dy;
                const f = -this.data.area / d;
                if (this.buttom) {
                    const t = Math.atan2(dy, dx);
                    px -= f * Math.cos(t);
                    py -= f * Math.sin(t);
                    this.colorChange.setHSL(.5 + zigzagTime, 1.0, .5);
                    coulors.setXYZ(i, this.colorChange.r, this.colorChange.g, this.colorChange.b);
                    coulors.needsUpdate = true;
                    if ((px > (initX + 70)) || (px < (initX - 70)) || (py > (initY + 70) || (py < (initY - 70)))) {
                        this.colorChange.setHSL(.15, 1.0, .5);
                        coulors.setXYZ(i, this.colorChange.r, this.colorChange.g, this.colorChange.b);
                        coulors.needsUpdate = true;
                    }
                } else {
                    if (mouseDistance < this.data.area) {
                        if (i % 5 == 0) {
                            const t = Math.atan2(dy, dx);
                            px -= .03 * Math.cos(t);
                            py -= .03 * Math.sin(t);
                            thi
