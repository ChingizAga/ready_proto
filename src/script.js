import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

/**
 * Base
 */
// Debug
const gui = new GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Texture
const textureLoader = new THREE.TextureLoader();

const textureHeader = textureLoader.load("/models/cs_stkr/cs_stkr_header.jpg");
const textureBody = textureLoader.load("/models/cs_stkr/cs_stkr_body.jpg");

textureHeader.flipY = false;
textureBody.flipY = false;

// Models
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

let mixer = null;
let action = null; // Define action here

gltfLoader.load("/models/cs_stkr/cs_stkr.gltf", (gltf) => {
  scene.add(gltf.scene);

  mixer = new THREE.AnimationMixer(gltf.scene);
  console.log(gltf.scene);
  action = mixer.clipAction(gltf.animations[0]);

  // Texture for a specific parts of the model
  const headerMesh = gltf.scene.getObjectByName("cs_stkr_header");
  const bodyMesh = gltf.scene.getObjectByName("cs_stkr_body");

  if (bodyMesh && bodyMesh.isMesh) {
    bodyMesh.material.map = textureBody;
    bodyMesh.material.needsUpdate = true;
  }

  if (headerMesh && headerMesh.isMesh) {
    headerMesh.material.map = textureHeader;
    headerMesh.material.needsUpdate = true;
  }

  // Animation Plays Once
  action.setLoop(THREE.LoopOnce);
  action.clampWhenFinished = true;
  action.paused = true;

  // Create control functions
  const controlAnimation = {
    open: () => {
      action.timeScale = 1;
      action.reset();
      action.play();
    },
    close: () => {
      action.timeScale = -1;
      action.paused = false;
      action.play();
      action.time = action.getClip().duration;
    },
  };

  gui.add(controlAnimation, "open").name("Open Display");
  gui.add(controlAnimation, "close").name("Close Display");
});

/**
 * Floor
 */
// const floor = new THREE.Mesh(
//   new THREE.PlaneGeometry(10, 10),
//   new THREE.MeshStandardMaterial({
//     color: "#444444",
//     metalness: 0,
//     roughness: 0.5,
//   })
// );
// floor.receiveShadow = true;
// floor.rotation.x = -Math.PI * 0.5;
// scene.add(floor);

// Environment Light
const rgbeLoader = new RGBELoader();
rgbeLoader.load("/hdri/rostock_laage_airport_1k.hdr", (environmentMap) => {
  environmentMap.mapping = THREE.EquirectangularReflectionMapping;

  scene.background = environmentMap;
  scene.environment = environmentMap;
});

/**
 * Lights
 */
// const ambientLight = new THREE.AmbientLight(0xffffff, 1);
// scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.1);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
// Camera position (x, y, z)
camera.position.set(-1, 2, 1.6);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.75, 0);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  // Update mixer
  if (mixer !== null) {
    mixer.update(deltaTime);
  }

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
