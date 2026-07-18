import './style.css';

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;

document.body.appendChild(renderer.domElement);
document.body.appendChild(
    ARButton.createButton(renderer, {
        requiredFeatures: ['hit-test']
    })
);
const controls = new OrbitControls(camera, renderer.domElement);

controls.enableDamping = true;

controls.dampingFactor = 0.05;

controls.screenSpacePanning = false;

controls.minDistance = 1;

controls.maxDistance = 30;

// Luz
const light = new THREE.HemisphereLight(0xffffff, 0x444444, 3);
scene.add(light);

// Cargar modelo
const loader = new GLTFLoader();

loader.load(
    '/modelo.glb',

    function (gltf) {

        const modelo = gltf.scene;

        modelo.scale.set(1,1,1);

        modelo.position.set(0,0,0);

        scene.add(modelo);

    },

    undefined,

    function (error) {

        console.error(error);

    }

);

camera.position.z = 3;

renderer.setAnimationLoop(() => {

    controls.update();

    renderer.render(scene, camera);

});

window.addEventListener('resize',()=>{

camera.aspect=window.innerWidth/window.innerHeight;

camera.updateProjectionMatrix();

renderer.setSize(window.innerWidth,window.innerHeight);

});