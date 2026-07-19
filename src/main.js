import './style.css';

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';



// ===== Variables WebXR =====
let modelo = null;

let modeloColocado = false;

let hitPose = null;

let hitTestSource = null;

let localSpace = null;

let viewerSpace = null;

let hitTestSourceRequested = false;

const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.setClearColor(0x000000,0);

document.body.appendChild(renderer.domElement);
const arButton = ARButton.createButton(renderer, {
    requiredFeatures: ['hit-test'],
    optionalFeatures: ['dom-overlay'],
    domOverlay: {
        root: document.body
    }
});

document.body.appendChild(arButton);

renderer.xr.addEventListener("sessionstart", async () => {

    console.log("✅ Sesión AR iniciada");

    controls.enabled = false;

    const session = renderer.xr.getSession();

    if (!hitTestSourceRequested) {

        try {

            viewerSpace = await session.requestReferenceSpace('viewer');

            localSpace = await session.requestReferenceSpace('local');

            hitTestSource = await session.requestHitTestSource({
                space: viewerSpace
            });

            hitTestSourceRequested = true;

            console.log("✅ Hit Test inicializado");

        } catch (error) {

            console.error("❌ Error al inicializar Hit Test:", error);

        }

    }

});

renderer.xr.addEventListener("sessionend", () => {

    console.log("❌ Sesión AR finalizada");

    controls.enabled = true;

    hitTestSourceRequested = false;

    hitTestSource = null;

    viewerSpace = null;

    localSpace = null;

});

const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = true;

controls.enableDamping = true;

controls.dampingFactor = 0.05;

controls.screenSpacePanning = false;

controls.minDistance = 1;

controls.maxDistance = 30;

// Luz
const light = new THREE.HemisphereLight(0xffffff, 0x444444, 3);
scene.add(light);

// Cargar modelo
// Cargar modelo
const loader = new GLTFLoader();

loader.load(

    `${import.meta.env.BASE_URL}modelo.glb`,

    function(gltf){

        console.log("✅ Modelo cargado");

        modelo = gltf.scene;

        //console.log(modelo);

        modelo.scale.set(1,1,1);

        // No mostrar el modelo todavía
        modelo.visible = true;

        scene.add(modelo);

    },

    function(xhr){

        console.log(
            "Progreso:",
            (xhr.loaded / xhr.total * 100).toFixed(2) + "%"
        );

    },

    function(error){

        console.error("ERROR:", error);

    }

);

camera.position.z = 3;

renderer.setAnimationLoop((time, frame) => {

    controls.update();

    if (frame && hitTestSource && localSpace && modelo) {

        const hitTestResults = frame.getHitTestResults(hitTestSource);

// Solo mostrar este mensaje una vez
if (!window.debugHitTest) {

    console.log("HitTestResults:", hitTestResults.length);

}

if (hitTestResults.length > 0) {

    console.log("✅ Se detectó una superficie");

    const hit = hitTestResults[0];

    hitPose = hit.getPose(localSpace);

    if (hitPose) {

        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();

        new THREE.Matrix4()
            .fromArray(hitPose.transform.matrix)
            .decompose(position, quaternion, scale);

        modelo.visible = true;

        modelo.position.copy(position);
        modelo.quaternion.copy(quaternion);

    }

}

    }

    renderer.render(scene, camera);

});

window.addEventListener('resize',()=>{

camera.aspect=window.innerWidth/window.innerHeight;

camera.updateProjectionMatrix();

renderer.setSize(window.innerWidth,window.innerHeight);

});