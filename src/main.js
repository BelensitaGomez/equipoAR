import './style.css';

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';



// ===== Variables WebXR =====
let modelo = null;

let modeloColocado = false;

let hitTestSource = null;

let localSpace = null;

let viewerSpace = null;


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

            modeloColocado = false;

            console.log("✅ Hit Test inicializado");

        } catch (error) {

            console.error("❌ Error al inicializar Hit Test:", error);

        }

    }

});

renderer.xr.addEventListener("sessionend", () => {

    console.log("❌ Sesión AR finalizada");

    controls.enabled = true;

    hitTestSource = null;

    viewerSpace = null;

    localSpace = null;

    modeloColocado = false;

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

    if (frame && hitTestSource && localSpace && modelo && !modeloColocado) {

        const hitTestResults = frame.getHitTestResults(hitTestSource);

        if (hitTestResults.length > 0) {

            const hit = hitTestResults[0];
            const hitPose = hit.getPose(localSpace);

            if (hitPose) {

                const position = new THREE.Vector3();

                position.setFromMatrixPosition(
                    new THREE.Matrix4().fromArray(hitPose.transform.matrix)
                );

                // Mostrar el modelo
                modelo.visible = true;

                // Colocarlo una sola vez
                modelo.position.copy(position);

                // Mantener la orientación original
                modelo.rotation.set(0, 0, 0);

                // Ya quedó colocado
                modeloColocado = true;

                console.log("✅ Modelo colocado");

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