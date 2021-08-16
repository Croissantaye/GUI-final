import * as THREE from 'https://cdn.skypack.dev/three';
import { GUI } from "https://cdn.skypack.dev/three/examples/jsm/libs/dat.gui.module"
// import * as THREE from "three";

const canvas = document.querySelector("canvas#webgl");
// console.log(canvas);
const scene = new THREE.Scene();
scene.background = new THREE.Color(.5, .5, .5);

const camera = new THREE.PerspectiveCamera( 75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000 );
scene.add(camera);

const renderer = new THREE.WebGLRenderer({canvas: canvas});
renderer.setSize( canvas.clientWidth, canvas.clientHeight );

const geometry = new THREE.BoxGeometry(1,1,1,10,10,10);
const material = new THREE.MeshStandardMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
const wireFrame = new THREE.WireframeGeometry(geometry);
const line = new THREE.LineSegments( wireFrame );
console.log(geometry.toJSON());
line.material.depthTest = false;
line.material.opacity = 0.25;
line.material.transparent = true;

scene.add( line );
// scene.add( cube );

const pLight = new THREE.PointLight();
pLight.position.z = 3;
pLight.position.y = 3;

scene.add(pLight);

camera.position.z = 5;

const gui = new GUI()
const cubeFolder = gui.addFolder('Cube')
cubeFolder.add(line.rotation, 'x', 0, Math.PI * 2)
cubeFolder.add(line.rotation, 'y', 0, Math.PI * 2)
cubeFolder.add(line.rotation, 'z', 0, Math.PI * 2)
cubeFolder.open()
const cameraFolder = gui.addFolder('Camera')
cameraFolder.add(camera.position, 'z', 0, 10)
cameraFolder.open()

const animate = function () {
    requestAnimationFrame( animate );

    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.render( scene, camera );
};

animate();