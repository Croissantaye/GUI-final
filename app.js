import * as THREE from 'https://cdn.skypack.dev/three';
// import * as THREE from "three";

const canvas = document.getElementById("webgl");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer(canvas);
console.log(renderer.domElement);
renderer.domElement = canvas;
renderer.clearColor(1)
renderer.setSize( canvas.clientWidth, canvas.clientHeight );

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 5;

// const animate = function () {
//     requestAnimationFrame( animate );

//     cube.rotation.x += 0.01;
//     cube.rotation.y += 0.01;

//     renderer.render( scene, camera );
// };

// animate();
scene.background = new THREE.Color(1, 0, 0);
renderer.render(scene, camera);