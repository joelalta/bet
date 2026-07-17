/*
----------------------------------------

v0.8.0 - Interactive Inspection Workflow

Implemented the complete inspection experience for the BET Hub prototype.

Added:
- Sliding HTML information panel
- Dedicated panel.js module
- Modular openPanel() / closePanel() functions
- Event-driven communication between UI and Three.js
- Custom panelClosed event
- Close button (X) functionality
- Synchronised panel and component selection state
- Component deselection by clicking the selected component
- Consistent open/close behaviour across all interaction paths

Refactored:
- Separated 3D interaction (script.js) from UI behaviour (panel.js)
- Preserved HTML as the source of truth for content
- Preserved CSS as the source of truth for presentation

Result:
The application now has a complete interaction loop:

Overview
→ Open Container
→ Inspection Mode
→ Select Component
→ Component Raises
→ Information Panel Opens
→ Deselect or Close
→ Component Returns
→ Panel Closes

This establishes the core interaction architecture for future component content and UI expansion.

----------------------------------------
*/



//IMPORTS
import { openPanel, closePanel } from "./panel.js";
import * as THREE from "three";
import { GLTFLoader } from "https://unpkg.com/three@0.156.1/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "https://unpkg.com/three@0.156.1/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://unpkg.com/three@0.156.1/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "https://unpkg.com/three@0.156.1/examples/jsm/postprocessing/OutlinePass.js";
import { OutputPass } from "https://unpkg.com/three@0.156.1/examples/jsm/postprocessing/OutputPass.js";
import { RGBELoader } from "https://unpkg.com/three@0.156.1/examples/jsm/loaders/RGBELoader.js"
import { DRACOLoader } from "https://unpkg.com/three@0.178.0/examples/jsm/loaders/DRACOLoader.js";
//import { OrbitControls } from "https://unpkg.com/three@0.156.1/examples/jsm/controls/OrbitControls.js";

//CONFIGURATION
const components = {};

const betMeshes = [];
const locoMeshes = [];

const betNavigationMeshes = [];

//DRACO LOADER
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(
  "https://unpkg.com/three@0.178.0/examples/jsm/libs/draco/",
);

// TEMPORARY
const clickableMeshes = betMeshes;

//APPLICATION STATE
//Component Interaction
const Focus = {
  BET: "bet",
  LOCO: "loco",
};
let currentFocus = Focus.BET;

let selectedComponent = null;
let hoveredComponent = null;

//DOM Elements
const betButton = document.getElementById("betButton");
const locoButton = document.getElementById("locoButton");

//Application Modes
let wagonOpen = false;
let inspectionMode = false;

//Container Open Animation
let enclosure = null;
let enclosureHomeY = 0;
let enclosureTargetY = 0;

//Rendering
let composer;
let outlinePass;

//Input
const mouse = new THREE.Vector2(999, 999);
const raycaster = new THREE.Raycaster();

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xFFFFFF);

// CAMERA
const camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

// Camera Positions
const overviewCameraPosition = new THREE.Vector3(
    4.724600,
    3.148104,
    8.755400
);

const betCameraPosition = new THREE.Vector3(
   -2.711193,
    1.714992,
    4.612955
);

const locoCameraPosition = new THREE.Vector3(
    4.954325,
    2.655505,
    5.351711
);

// Camera Look Targets
const overviewLookTarget = new THREE.Vector3(
    -0.045210,
    1.658378,
    1.738596
);

const betLookTarget = new THREE.Vector3(
   -3.080161,
    1.581793,
    4.120387
);

const locoLookTarget = new THREE.Vector3(
    1.241683,
    0.625290,
    1.075862
);

// Current camera state
camera.position.copy(overviewCameraPosition);

const cameraTargetPosition = overviewCameraPosition.clone();
const cameraLookTarget = overviewLookTarget.clone();
const cameraTargetLookAt = overviewLookTarget.clone();

// RENDERER
const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setPixelRatio(window.devicePixelRatio);

renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

// HDRI Environment
const pmremGenerator = new THREE.PMREMGenerator(renderer);

new RGBELoader().load(

    "assets/sunset.hdr",

    (texture) => {

        const envMap = pmremGenerator
            .fromEquirectangular(texture)
            .texture;

        scene.environment = envMap;

        texture.dispose();

    }

);

//Composer 
composer = new EffectComposer(renderer);

const renderPass = new RenderPass(scene, camera);

composer.addPass(renderPass);

composer.setSize(
    window.innerWidth,
    window.innerHeight
);

outlinePass = new OutlinePass(

    new THREE.Vector2(
        window.innerWidth,
        window.innerHeight
    ),

    scene,
    camera

);

outlinePass.visibleEdgeColor.set("#0059FF");
outlinePass.hiddenEdgeColor.set("#0059FF");

outlinePass.edgeGlow = 0;
outlinePass.edgeStrength = 10;
outlinePass.edgeThickness = 2;
outlinePass.pulsePeriod = 0;

composer.addPass(outlinePass);

// Final colour output
composer.addPass(new OutputPass());

// LIGHTING
// Soft ambient light
// const ambient = new THREE.AmbientLight(0xffffff, 1.5);
// scene.add(ambient);

// // Main key light
// const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
// keyLight.position.set(6, 8, 8);
// scene.add(keyLight);

// // Fill light
// const fillLight = new THREE.DirectionalLight(0xffffff, 1.4);
// fillLight.position.set(-6, 2, 4);
// scene.add(fillLight);

// // Rim light
// const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
// rimLight.position.set(-4, 6, -8);
// scene.add(rimLight);


// MODEL LOADER
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

loader.load("BET.glb", function (gltf) {

    const model = gltf.scene;

    model.scale.set(0.4, 0.4, 0.4);

    scene.add(model);

    enclosure = model.getObjectByName("Container");

    if (!enclosure) {

        console.error("Container mesh not found.");

        return;

    }

    clickableMeshes.push(enclosure);

    enclosureHomeY = enclosure.position.y;
    enclosureTargetY = enclosure.position.y;

// Register BET Components
registerComponent(model, "AirCompressor", Focus.BET, 0.6);

registerComponent(model, "BatteryRack", Focus.BET, 1.5);

registerComponent(model, "BMS", Focus.BET, 1.5);

registerComponent(model, "ControlCabinet", Focus.BET, 0.5);

registerComponent(model, "Cooling", Focus.BET, 0.6);

registerComponent(model, "DCACConverter", Focus.BET, 0.7);

registerComponent(model, "DCDCConverters", Focus.BET, 0.8);

//Register Loco Components
registerComponent(model, "DriversCab", Focus.LOCO, 0.6);

registerComponent(model, "Body", Focus.LOCO, 1.4);

registerComponent(model, "Bogie", Focus.LOCO, -1.2);

//Navigation Meshes
betNavigationMeshes.push(
      model.getObjectByName("BatteryRack"),
      model.getObjectByName("Cooling"),
      model.getObjectByName("DCACConverter"),
      model.getObjectByName("Container"),
    );
});



//INTERACTION FUNCTIONS
//Register Components
function registerComponent(model, name, focus, movementOffset) {

    const mesh = model.getObjectByName(name);

    if (!mesh) {

        console.warn(`Component "${name}" not found`);

        return;

    }

    components[name] = {

        mesh: mesh,

        homePosition: mesh.position.y,

        targetY: mesh.position.y,

        movementOffset: movementOffset,

        homeScale: mesh.scale.clone()

    };

    switch (focus) {
      case Focus.BET:
        betMeshes.push(mesh);
        break;

      case Focus.LOCO:
        locoMeshes.push(mesh);
        break;
    }

}

//Hover Over Components
function hoverComponent(name) {

    // Already hovering this component
    if (hoveredComponent === name) return;

    // Remove previous hover
    if (hoveredComponent) {

        outlinePass.selectedObjects = [];

    }

    // Hovering nothing
    if (!name) {

        hoveredComponent = null;

        return;

    }

    // Hover new component
    const current = components[name];
    if (!current) return;

    outlinePass.selectedObjects = [
        current.mesh
    ];

    hoveredComponent = name;

}

//Select Components
function selectComponent(name) {

    const component = components[name];

    if(!component) return;

    // Clicking the selected component deselects it
    if(selectedComponent === name) {

        component.targetY = component.homePosition;

        selectedComponent = null;

        document.dispatchEvent(new CustomEvent("panelClosed"));

        return;

    }

    // Return previously selected component
    if(selectedComponent) {

        const previous = components[selectedComponent];

        previous.targetY = previous.homePosition;

    }

    // Select the new component
    component.targetY =
        component.homePosition +
        component.movementOffset;

    selectedComponent = name;

}

// Click Components
function handleClick(objectName) {

    // First click enters the experience
    if (!wagonOpen) {

        wagonOpen = true;

        enclosureTargetY = enclosureHomeY + 4.5;

        cameraTargetPosition.copy(betCameraPosition);
        cameraTargetLookAt.copy(betLookTarget);

        return;

    }

    // Wait until the camera has arrived
    if (!inspectionMode) return;

    switch (objectName) {
      case "AirCompressor":
        selectComponent("AirCompressor");

        if (selectedComponent) {
          openPanel("airCompressor");
        }

        break;

      case "BatteryRack":
        selectComponent("BatteryRack");

        if (selectedComponent) {
          openPanel("battery");
        }

        break;

      case "BMS":
        selectComponent("BMS");

        if (selectedComponent) {
          openPanel("bms");
        }

        break;

      case "ControlCabinet":
        selectComponent("ControlCabinet");

        if (selectedComponent) {
          openPanel("controlCabinet");
        }

        break;

      case "Cooling":
        selectComponent("Cooling");

        if (selectedComponent) {
          openPanel("cooling");
        }

        break;

      case "DCACConverter":
        selectComponent("DCACConverter");

        if (selectedComponent) {
          openPanel("dcac");
        }

        break;

      case "DCDCConverters":
        selectComponent("DCDCConverters");

        if (selectedComponent) {
          openPanel("dcdc");
        }

        break;
    
      case "DriversCab":
        selectComponent("DriversCab");

        if (selectedComponent) {
            openPanel("driversCab");
        }

        break;

      case "Body":
        selectComponent("Body");

        if (selectedComponent) {
            openPanel("body");
        }

        break;

      case "Bogie":
        selectComponent("Bogie");

        if (selectedComponent) {
            openPanel("bogie");
        }

      break;

      case "Wagon":
        selectComponent("Wagon");

        if (selectedComponent) {
            openPanel("wagon");
        }

        break;

  }
}

function updateFocusButtons() {
  if (currentFocus === Focus.BET) {
    betButton.classList.add("active");
    locoButton.classList.remove("active");

    betButton.src = "BETButtonActive.svg";
    locoButton.src = "LocoButton.svg";
  } else {
    locoButton.classList.add("active");
    betButton.classList.remove("active");

    locoButton.src = "LocoButtonActive.svg";
    betButton.src = "BETButton.svg";
  }
}

//Input Events
//Mouse Move
window.addEventListener("mousemove", (event) => {

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

});

//Mouse Click
window.addEventListener("click", () => {
  // First click always enters the experience
  if (!wagonOpen) {
    handleClick(null);
    return;
  }

  raycaster.setFromCamera(mouse, camera);

  // Navigation back to BET
  if (currentFocus === Focus.LOCO) {
    const navHits = raycaster.intersectObjects(betNavigationMeshes, true);

    if (navHits.length > 0) {
      currentFocus = Focus.BET;

      cameraTargetPosition.copy(betCameraPosition);
      cameraTargetLookAt.copy(betLookTarget);

      updateFocusButtons();

      return;
    }
  }

  const intersects = raycaster.intersectObjects(getActiveMeshes(), true);

  if (intersects.length > 0) {
    const componentName = getComponentName(intersects[0].object);

    if (componentName) {
      handleClick(componentName);
    }
  }
});

document.addEventListener("panelClosed", () => {
  if (selectedComponent) {
    const component = components[selectedComponent];

    component.targetY = component.homePosition;

    selectedComponent = null;
  }

  closePanel();
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  composer.setSize(window.innerWidth, window.innerHeight);
});

betButton.addEventListener("click", () => {
  if (!wagonOpen || selectedComponent) return;

  currentFocus = Focus.BET;
  cameraTargetPosition.copy(betCameraPosition);
  cameraTargetLookAt.copy(betLookTarget);

  updateFocusButtons();
});

locoButton.addEventListener("click", () => {
  if (!wagonOpen || selectedComponent) return;

  currentFocus = Focus.LOCO;
  cameraTargetPosition.copy(locoCameraPosition);
  cameraTargetLookAt.copy(locoLookTarget);

  updateFocusButtons();
});

function getActiveMeshes() {
  switch (currentFocus) {
    case Focus.BET:
      return betMeshes;

    case Focus.LOCO:
      return locoMeshes;

    default:
      return [];
  }
}

function getComponentName(object) {
  while (object) {
    if (components[object.name]) {
      return object.name;
    }

    object = object.parent;
  }

  return null;
}

//ANIMATION
// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Animate components
  for (const component of Object.values(components)) {
    component.mesh.position.y +=
      (component.targetY - component.mesh.position.y) * 0.08;
  }

  // Animate Container
  if (enclosure) {
    enclosure.position.y += (enclosureTargetY - enclosure.position.y) * 0.08;
  }

  //Animate camera
    camera.position.lerp(cameraTargetPosition, 0.05);

    cameraLookTarget.lerp(cameraTargetLookAt, 0.05);

    camera.lookAt(cameraLookTarget);

  if (
    wagonOpen &&
    currentFocus === Focus.BET &&
    camera.position.distanceTo(betCameraPosition) < 0.05
  ) {
    inspectionMode = true;
  }

  //BET Group focus in Loco
  // if (currentFocus === Focus.LOCO) {
  //   raycaster.setFromCamera(mouse, camera);

  //   const intersects = raycaster.intersectObjects(betNavigationMeshes, true);

  //   if (intersects.length > 0) {
  //     outlinePass.selectedObjects = betNavigationMeshes;
  //   } else {
  //     outlinePass.selectedObjects = [];
  //   }
  // }

  // Raycasting
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(getActiveMeshes(), true);

  if (intersects.length > 0) {
    const componentName = getComponentName(intersects[0].object);

    if (inspectionMode) {
      hoverComponent(componentName);
    }
  } else {
    if (inspectionMode) {
      hoverComponent(null);
    }
  }

  composer.render();
}

updateFocusButtons();
animate();