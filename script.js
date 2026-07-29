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
import {
  openPanel,
  closePanel,
} from "./panel.js";
import * as THREE from "three";
import { GLTFLoader } from "https://unpkg.com/three@0.156.1/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "https://unpkg.com/three@0.156.1/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://unpkg.com/three@0.156.1/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "https://unpkg.com/three@0.156.1/examples/jsm/postprocessing/OutlinePass.js";
import { SMAAPass } from "https://unpkg.com/three@0.156.1/examples/jsm/postprocessing/SMAAPass.js";
import { OutputPass } from "https://unpkg.com/three@0.156.1/examples/jsm/postprocessing/OutputPass.js";
import { RGBELoader } from "https://unpkg.com/three@0.156.1/examples/jsm/loaders/RGBELoader.js"
import { DRACOLoader } from "https://unpkg.com/three@0.178.0/examples/jsm/loaders/DRACOLoader.js";
//import { OrbitControls } from "https://unpkg.com/three@0.156.1/examples/jsm/controls/OrbitControls.js";

//CONFIGURATION
const components = {};

// Selected components are composed on the left so the information panel can
// occupy the right side without covering the 3D subject.
const COMPONENT_PRESENTATION_SCREEN_X = -0.42;
const AIR_COMPRESSOR_CAMERA_PULL = 2.5;
const BATTERY_SLIDE_DISTANCE = -1.5;
const BATTERY_CASCADE_DURATION_MS = 1500;
const BATTERY_SLIDE_DURATION_MS = 450;
const DCDC_SLIDE_DISTANCE = 2.5;
const DCDC_CASCADE_DURATION_MS = 1500;
const DCDC_SLIDE_DURATION_MS = 700;
const INSPECT_TRANSITION_DURATION_MS = 650;
const INSPECT_SCROLL_DISTANCE_PX = 600;
const INSPECT_ROTATION_DURATION_MS = 32000;
const INSPECT_SCALE = 1.08;
const INSPECT_SCREEN_POSITION = new THREE.Vector2(-0.2, 0);
const INSPECT_BACKGROUND_COLOUR = new THREE.Color(0xb8bcc2);
const INSPECT_SCENE_EXPOSURE = 0.62;
const INSPECT_SPOTLIGHT_INTENSITY = 10;
const INSPECT_RIM_SPOTLIGHT_INTENSITY = 18;
const INSPECT_RIM_LIGHT_FADE_MS = 500;
const RENDER_SUPERSAMPLE = 1;
const MAX_RENDER_PIXEL_RATIO = 2;
const MAX_RENDER_PIXELS = 8_300_000;
const CHARGER_HIDDEN_Y = 50;
const CHARGE_LIFT_DURATION_MS = 1100;
const PANTOGRAPH_REGEN_LIFT = 0.12;
const CHARGING_GUN_TRANSITION_MS = 3200;
const CHARGING_CABLE_POINT_COUNT = 24;
const CHARGING_CABLE_RADIUS = 0.015;
const NORMAL_SCENE_EXPOSURE = 1.1;
const INTRO_SCENE_EXPOSURE = 0.12;
const INTRO_TRANSITION_DURATION_MS = 900;
const NORMAL_BACKGROUND_COLOUR = new THREE.Color(0xFFFFFF);
const INTRO_BACKGROUND_COLOUR = new THREE.Color(0x080A0D);
const MOBILE_EXPERIENCE_QUERY = "(max-width: 768px), (pointer: coarse)";
const mobileExperienceMedia = window.matchMedia(MOBILE_EXPERIENCE_QUERY);
const MOBILE_FOCUS_OVERVIEW_DISTANCE_SCALE = 5.5;
const MOBILE_CHARGING_DISTANCE_SCALE = 5.3;
const MOBILE_COMPONENT_VIEWPORT_HEIGHT = 0.28;
const MOBILE_COMPONENT_VIEWPORT_WIDTH = 0.78;
const MOBILE_LOCO_CLOSEUP_VIEWPORT_HEIGHT = 0.62;
const MOBILE_LOCO_CLOSEUP_VIEWPORT_WIDTH = 1.45;
const MOBILE_BOGIE_SCREEN_X = -0.28;
const MOBILE_CHARGING_LOOK_LEFT_OFFSET = 0.65;
const MOBILE_CHARGING_CAMERA_LOWER_OFFSET = 0.85;
const MOBILE_CHARGING_LOOK_DOWN_OFFSET = 0.4;
const MOBILE_CHARGING_CAMERA_RIGHT_OFFSET = 0.2;
const CONTAINER_OPEN_LIFT = 4.5;
const MOBILE_CONTAINER_OPEN_LIFT = 14;

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
const ApplicationState = Object.freeze({
  OVERVIEW: "overview",
  CONTAINER_OPEN: "containerOpen",
  COMPONENT_SELECTED: "componentSelected",
  INSPECT_MODE: "inspectMode",
});

let applicationState = ApplicationState.OVERVIEW;

//Component Interaction
const Focus = {
  BET: "bet",
  LOCO: "loco",
  CHARGER: "charger",
};
const ChargingStage = Object.freeze({
  ROOFTOP: "rooftop",
  REGENERATIVE: "regenerative",
  PLUGIN: "plugin",
});
let currentFocus = Focus.BET;
let chargingStage = ChargingStage.ROOFTOP;

let selectedComponent = null;
let hoveredComponent = null;
let pendingFocusTransition = null;
let pendingFocusAfterInspectionExit = null;
let pendingComponentNavigation = null;
let componentInteractionLockedUntil = 0;

const COMPONENT_INTERACTION_SETTLE_MS = 700;

const COMPONENT_NAVIGATION = Object.freeze({
  [Focus.BET]: [
    { component: "AirCompressor", panel: "airCompressor" },
    { component: "BatteryRack", panel: "battery", aliases: ["BMS"] },
    { component: "ControlCabinet", panel: "controlCabinet" },
    { component: "Cooling", panel: "cooling" },
    { component: "DCACConverter", panel: "dcac" },
    { component: "DCDCConverters", panel: "dcdc" },
  ],
  [Focus.LOCO]: [
    { component: "DriversCab", panel: "driversCab" },
    { component: "Body", panel: "body" },
    { component: "Bogie", panel: "bogie" },
  ],
});
const BATTERY_SYSTEM_COMPONENTS = Object.freeze(["BatteryRack", "BMS"]);

function getSelectionGroup(componentName) {
    return BATTERY_SYSTEM_COMPONENTS.includes(componentName)
        ? BATTERY_SYSTEM_COMPONENTS
        : [componentName];
}

function selectionGroupsMatch(firstName, secondName) {
    return getSelectionGroup(firstName).some((name) =>
        getSelectionGroup(secondName).includes(name)
    );
}

function setSelectionGroupSelectedState(componentName, isSelected) {
    getSelectionGroup(componentName).forEach((name) => {
        const component = components[name];
        if (component) setComponentSelectedState(component, isSelected);
    });
}

function updateComponentNavigationPosition(componentName) {
    const cycle = COMPONENT_NAVIGATION[currentFocus];
    if (!cycle?.length || !componentName) return;

    const index = cycle.findIndex((item) =>
        item.component === componentName ||
        item.aliases?.includes(componentName)
    );
    if (index < 0) return;

    document.dispatchEvent(new CustomEvent("componentNavigationPositionChanged", {
        detail: {
            position: index + 1,
            total: cycle.length,
        },
    }));
}

function getComponentInteractionSettleMs(componentName) {
    return getSelectionGroup(componentName).reduce((durationMs, name) => {
        const cascade = components[name]?.cascade;
        if (!cascade) return durationMs;

        const cascadeDuration = isMobileExperience()
            ? INSPECT_TRANSITION_DURATION_MS
            : cascade.slideDurationMs +
              cascade.delayMs * Math.max(cascade.animatedItems.length - 1, 0);

        return Math.max(durationMs, cascadeDuration);
    }, COMPONENT_INTERACTION_SETTLE_MS);
}

function lockComponentInteractions(...componentNames) {
    const durationMs = componentNames.reduce(
        (longestDuration, componentName) => Math.max(
            longestDuration,
            getComponentInteractionSettleMs(componentName)
        ),
        COMPONENT_INTERACTION_SETTLE_MS
    );
    componentInteractionLockedUntil = performance.now() + durationMs;

    document.dispatchEvent(new CustomEvent("componentNavigationLockChanged", {
        detail: { locked: true, durationMs },
    }));
}

function componentInteractionsAreLocked() {
    return performance.now() < componentInteractionLockedUntil;
}

//DOM Elements
const betButton = document.getElementById("betButton");
const locoButton = document.getElementById("locoButton");
const chargerButton = document.getElementById("chargerButton");
const introPrompt = document.getElementById("introPrompt");
const introPromptText = document.getElementById("introPromptText");
const introProgressBar = document.getElementById("introProgressBar");

//Inspection presentation
let modelRoot = null;
let betRoot = null;
let inspectSession = null;

function isMobileExperience() {
    return mobileExperienceMedia.matches;
}

function getContainerOpenLift() {
    return isMobileExperience()
        ? MOBILE_CONTAINER_OPEN_LIFT
        : CONTAINER_OPEN_LIFT;
}

//Container Open Animation
let enclosure = null;
let enclosureHomeY = 0;
let enclosureTargetY = 0;
let charger = null;
let chargerHomeY = 0;
let chargerTargetY = CHARGER_HIDDEN_Y;
let synchronizedChargeLift = null;
let pantograph = null;
let pantographHomeY = 0;
let pantographTargetY = 0;
let pantographFlowMaterial = null;
let wheelRegenFlowMaterial = null;
let chargingGunSession = null;
let introTransitionStartedAt = null;
let modelIsReady = false;
let environmentIsReady = false;
let experienceLoadFailed = false;
let modelLoadProgress = 0;

function updateIntroLoadingState() {
    introProgressBar.style.transform = `scaleX(${modelLoadProgress})`;

    if (experienceLoadFailed) {
        introPromptText.textContent = "Unable to load BET";
        introPrompt.disabled = true;
        return;
    }

    if (modelIsReady && environmentIsReady) {
        introPromptText.textContent = "Click to enter BET";
        introPrompt.disabled = false;
        introPrompt.classList.add("is-ready");
        return;
    }

    if (modelLoadProgress >= 1 || modelIsReady) {
        introPromptText.textContent = "Preparing experience…";
        return;
    }

    introPromptText.textContent =
      `Loading BET — ${Math.round(modelLoadProgress * 100)}%`;
}

//Rendering
let composer;
let outlinePass;

//Input
const mouse = new THREE.Vector2(999, 999);
const raycaster = new THREE.Raycaster();

// SCENE
const scene = new THREE.Scene();
scene.background = INTRO_BACKGROUND_COLOUR.clone();

// CAMERA
const BET_CAMERA_FOV = 40;
const LOCO_CAMERA_FOV = 52;

const camera = new THREE.PerspectiveCamera(
    BET_CAMERA_FOV,
    window.innerWidth / window.innerHeight,
    0.1,
    100
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
    5.210651,
    1.714992,
    4.612955
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
    4.841683,
    1.581793,
    4.120387
);

// Current camera state
camera.position.copy(overviewCameraPosition);

const cameraTargetPosition = overviewCameraPosition.clone();
const responsiveCameraPosition = overviewCameraPosition.clone();
const cameraLookTarget = overviewLookTarget.clone();
const cameraTargetLookAt = overviewLookTarget.clone();
const responsiveCameraLookTarget = overviewLookTarget.clone();
let cameraTargetFov = BET_CAMERA_FOV;

// RENDERER
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
});

function getRenderPixelRatio() {
    const qualityPixelRatio = Math.min(
        (window.devicePixelRatio || 1) * RENDER_SUPERSAMPLE,
        MAX_RENDER_PIXEL_RATIO
    );
    const pixelBudgetRatio = Math.sqrt(
        MAX_RENDER_PIXELS / (window.innerWidth * window.innerHeight)
    );

    return Math.max(1, Math.min(qualityPixelRatio, pixelBudgetRatio));
}

function resizeRenderPipeline() {
    const pixelRatio = getRenderPixelRatio();

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    if (composer) {
        composer.setPixelRatio(pixelRatio);
        composer.setSize(window.innerWidth, window.innerHeight);
    }
}

renderer.setPixelRatio(getRenderPixelRatio());

renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = INTRO_SCENE_EXPOSURE;

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

        environmentIsReady = true;
        updateIntroLoadingState();

    },

    undefined,

    (error) => {
        experienceLoadFailed = true;
        updateIntroLoadingState();
        console.error("HDR environment failed to load.", error);
    }

);

//Composer 
composer = new EffectComposer(renderer);
composer.setPixelRatio(getRenderPixelRatio());

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

// Native renderer antialiasing does not affect EffectComposer's off-screen
// buffers. SMAA resolves geometry and OutlinePass edges in the final image.
const smaaPass = new SMAAPass(
    window.innerWidth * getRenderPixelRatio(),
    window.innerHeight * getRenderPixelRatio()
);
composer.addPass(smaaPass);

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
    modelRoot = model;
    betRoot = model.getObjectByName("BET");

    model.scale.set(0.4, 0.4, 0.4);

    scene.add(model);

    charger = model.getObjectByName("Charger");
    if (charger) {
        chargerHomeY = charger.position.y;
        charger.position.y = CHARGER_HIDDEN_Y;
        chargerTargetY = CHARGER_HIDDEN_Y;
    } else {
        console.warn("Charger parent node not found.");
    }

    pantograph = model.getObjectByName("Pantograph");
    if (pantograph?.isMesh) {
        pantographHomeY = pantograph.position.y;
        pantographTargetY = pantographHomeY;
        pantograph.geometry.computeBoundingBox();
        const bounds = pantograph.geometry.boundingBox;
        const flowMinY = bounds.min.y;
        const flowRangeY = Math.max(bounds.max.y - bounds.min.y, 0.001);

        pantographFlowMaterial = new THREE.ShaderMaterial({
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
            uniforms: {
                time: { value: 0 },
                opacity: { value: 0 },
                colour: { value: new THREE.Color(0x24a8ff) },
                flowMinY: { value: flowMinY },
                flowRangeY: { value: flowRangeY },
            },
            vertexShader: `
                uniform float flowMinY;
                uniform float flowRangeY;
                varying float vFlowPosition;

                void main() {
                    vFlowPosition = (position.y - flowMinY) / flowRangeY;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float opacity;
                uniform vec3 colour;
                varying float vFlowPosition;

                void main() {
                    float wave = fract(vFlowPosition * 3.0 - time * 0.9);
                    float band = 1.0 - smoothstep(0.0, 0.16, abs(wave - 0.5));
                    float softGlow = band * 0.85 + 0.08;
                    gl_FragColor = vec4(colour * softGlow, softGlow * opacity);
                }
            `,
        });

        const pantographFlow = new THREE.Mesh(
            pantograph.geometry,
            pantographFlowMaterial
        );
        pantographFlow.name = "PantographPowerFlow";
        pantographFlow.renderOrder = 2;
        pantograph.add(pantographFlow);
    } else {
        console.warn("Pantograph mesh not found for power-flow effect.");
    }

    const regenWheelMeshes = ["Wheels01", "Wheels02", "Wheels03", "Wheels04"]
        .map((name) => model.getObjectByName(name))
        .filter((wheel) => wheel?.isMesh);

    if (regenWheelMeshes.length) {
        wheelRegenFlowMaterial = new THREE.ShaderMaterial({
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
            uniforms: {
                time: { value: 0 },
                opacity: { value: 0 },
                colour: { value: new THREE.Color(0x168cff) },
            },
            vertexShader: `
                varying float vWheelAngle;

                void main() {
                    // The separated BET wheels use local Y as their axle axis.
                    vWheelAngle = atan(position.z, position.x) / 6.28318530718 + 0.5;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float opacity;
                uniform vec3 colour;
                varying float vWheelAngle;

                void main() {
                    float wave = fract(vWheelAngle * 3.0 - time * 0.55);
                    float band = 1.0 - smoothstep(0.0, 0.2, abs(wave - 0.5));
                    float glow = band * 0.9 + 0.1;
                    gl_FragColor = vec4(colour * glow, glow * opacity);
                }
            `,
        });

        regenWheelMeshes.forEach((wheel) => {
            const regenFlow = new THREE.Mesh(
                wheel.geometry,
                wheelRegenFlowMaterial
            );
            regenFlow.name = `${wheel.name}RegenerativeFlow`;
            regenFlow.renderOrder = 2;
            wheel.add(regenFlow);
        });
    } else {
        console.warn("Separated BET wheel meshes not found for regenerative flow.");
    }

    setupChargingGun(model);

    enclosure = model.getObjectByName("Container");

    if (!enclosure) {

        console.error("Container mesh not found.");

        return;

    }

    clickableMeshes.push(enclosure);

    enclosureHomeY = enclosure.position.y;
    enclosureTargetY = enclosure.position.y;

// Register BET Components
registerComponent(
    model,
    "AirCompressor",
    Focus.BET,
    0.6,
    null,
    AIR_COMPRESSOR_CAMERA_PULL
);

registerComponent(model, "BatteryRack", Focus.BET, 0);
configureChildCascade(
    "BatteryRack",
    "Batteries",
    "y",
    BATTERY_SLIDE_DISTANCE,
    BATTERY_CASCADE_DURATION_MS,
    BATTERY_SLIDE_DURATION_MS
);

registerComponent(model, "BMS", Focus.BET, 0);
configureChildCascade(
    "BMS",
    "BMS",
    "z",
    DCDC_SLIDE_DISTANCE,
    DCDC_CASCADE_DURATION_MS,
    DCDC_SLIDE_DURATION_MS
);

registerComponent(model, "ControlCabinet", Focus.BET, 0.5);

registerComponent(model, "Cooling", Focus.BET, 0);
configureChildCascade(
    "Cooling",
    "Cooling",
    "z",
    DCDC_SLIDE_DISTANCE,
    DCDC_CASCADE_DURATION_MS,
    DCDC_SLIDE_DURATION_MS
);

registerComponent(model, "DCACConverter", Focus.BET, 0.7, null, 0, true);

registerComponent(model, "DCDCConverters", Focus.BET, 0);
configureChildCascade(
    "DCDCConverters",
    "DCDCConverters",
    "z",
    DCDC_SLIDE_DISTANCE,
    DCDC_CASCADE_DURATION_MS,
    DCDC_SLIDE_DURATION_MS
);

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

    modelLoadProgress = 1;
    modelIsReady = true;
    updateIntroLoadingState();
},

(event) => {
    if (!event.lengthComputable || !event.total) return;

    modelLoadProgress = THREE.MathUtils.clamp(
      event.loaded / event.total,
      0,
      1
    );
    updateIntroLoadingState();
},

(error) => {
    experienceLoadFailed = true;
    updateIntroLoadingState();
    console.error("BET model failed to load.", error);
});



//INTERACTION FUNCTIONS
//Register Components
function registerComponent(
    model,
    name,
    focus,
    movementOffsetY,
    animatedObjectName = null,
    cameraPullForward = 0,
    inspectWholeAssembly = false
) {

    const mesh = model.getObjectByName(name);

    if (!mesh) {

        console.warn(`Component "${name}" not found`);

        return;

    }

    const animatedObject = animatedObjectName
        ? mesh.getObjectByName(animatedObjectName)
        : mesh;

    if (!animatedObject) {

        console.warn(
            `Animation object "${animatedObjectName}" not found inside component "${name}"`
        );

        return;

    }

    components[name] = {

        // The full component remains the raycast and outline target.
        mesh: mesh,

        focus,

        // This can be a child group when only part of an assembly should move.
        animatedObject: animatedObject,

        homePosition: animatedObject.position.clone(),

        targetPosition: animatedObject.position.clone(),

        movementOffset: new THREE.Vector3(0, movementOffsetY, 0),

        cameraPullForward,

        inspectWholeAssembly,

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

function getComponentPresentationPosition(component) {
    const parent = component.animatedObject.parent;
    const targetPosition = component.homePosition
        .clone()
        .add(component.movementOffset);

    if (!parent) return targetPosition;

    if (isMobileExperience()) {
        if (component.focus === Focus.LOCO) {
            if (component.mesh.name === "Body") {
                return getMobileObjectPresentationPosition(
                    component.animatedObject,
                    0,
                    MOBILE_LOCO_CLOSEUP_VIEWPORT_HEIGHT,
                    MOBILE_LOCO_CLOSEUP_VIEWPORT_WIDTH
                );
            }

            if (component.mesh.name === "Bogie") {
                return getMobileObjectPresentationPosition(
                    component.animatedObject,
                    MOBILE_BOGIE_SCREEN_X,
                    MOBILE_LOCO_CLOSEUP_VIEWPORT_HEIGHT,
                    MOBILE_LOCO_CLOSEUP_VIEWPORT_WIDTH
                );
            }
        }

        return getMobileObjectPresentationPosition(component.animatedObject);
    }

    // On desktop, locomotive components retain their authored local-axis
    // movement. Mobile uses the shared upper-viewport composition because the
    // bottom sheet occupies the lower half of the screen.
    if (component.focus === Focus.LOCO) {
        return targetPosition;
    }

    // Convert the component's intended local position to screen space, move it
    // left, then convert it back to the component parent's local coordinates.
    const targetWorldPosition = parent.localToWorld(targetPosition.clone());
    const targetScreenPosition = targetWorldPosition.clone().project(camera);

    targetScreenPosition.x = COMPONENT_PRESENTATION_SCREEN_X;

    targetScreenPosition.unproject(camera);

    if (component.cameraPullForward) {
        const directionToCamera = camera.position
            .clone()
            .sub(targetScreenPosition)
            .normalize();

        targetScreenPosition.add(
            directionToCamera.multiplyScalar(component.cameraPullForward)
        );
    }

    return parent.worldToLocal(targetScreenPosition);
}

function getMobileObjectPresentationPosition(
    object,
    screenX = 0,
    viewportHeight = MOBILE_COMPONENT_VIEWPORT_HEIGHT,
    viewportWidth = MOBILE_COMPONENT_VIEWPORT_WIDTH
) {
    const parent = object.parent;
    if (!parent) return object.position.clone();

    object.updateWorldMatrix(true, true);

    const bounds = new THREE.Box3().setFromObject(object);
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    const pivotWorldPosition = object.getWorldPosition(new THREE.Vector3());
    const centreOffset = sphere.center.clone().sub(pivotWorldPosition);

    const verticalHalfAngle = Math.atan(
        Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) *
        viewportHeight
    );
    const horizontalHalfAngle = Math.atan(
        Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) *
        camera.aspect *
        viewportWidth
    );
    const framingHalfAngle = Math.max(
        Math.min(verticalHalfAngle, horizontalHalfAngle),
        THREE.MathUtils.degToRad(2)
    );
    const cameraDistance = Math.max(
        sphere.radius / Math.sin(framingHalfAngle),
        camera.near + sphere.radius * 1.2
    );

    const displayDirection = new THREE.Vector3(screenX, 0.48, 0.5)
        .unproject(camera)
        .sub(camera.position)
        .normalize();
    const targetCentre = camera.position.clone()
        .addScaledVector(displayDirection, cameraDistance);
    const targetPivot = targetCentre.sub(centreOffset);

    return parent.worldToLocal(targetPivot);
}

function configureChildCascade(
    componentName,
    childGroupName,
    movementAxis,
    movementDistance,
    totalDurationMs,
    slideDurationMs
) {
    const component = components[componentName];
    const childGroup = component?.mesh.getObjectByName(childGroupName);

    if (!component || !childGroup) {
        console.warn(
            `Cascade group "${childGroupName}" not found inside component "${componentName}"`
        );
        return;
    }

    // Local X runs from the front of the rack toward the back. Sorting by X,
    // then Z, gives every battery its own position in the cascade.
    const cascadeMeshes = childGroup.isMesh
        ? [childGroup]
        : childGroup.children.filter((child) => child.isMesh);

    const animatedItems = cascadeMeshes
        .sort((a, b) =>
            (a.position.x - b.position.x) ||
            (b.position.z - a.position.z)
        )
        .map((mesh) => ({
            mesh,
            homePosition: mesh.position.clone(),
            homeValue: mesh.position[movementAxis],
            startValue: mesh.position[movementAxis],
        }));

    const delayMs = animatedItems.length > 1
        ? (totalDurationMs - slideDurationMs) / (animatedItems.length - 1)
        : 0;

    component.cascade = {
        animatedItems,
        movementAxis,
        movementDistance,
        delayMs,
        slideDurationMs,
        isExtended: false,
        transitionStartedAt: performance.now(),
    };
}

function setComponentSelectedState(component, isSelected) {
    if (component.cascade) {
        if (isMobileExperience()) {
            const cascade = component.cascade;
            const representative = getInspectionSubjects(component)[0];
            const representativeItem = cascade.animatedItems.find(
                (item) => item.mesh === representative
            );

            // Mobile presents one representative product while every sibling
            // remains in its authored position inside the BET.
            cascade.animatedItems.forEach((item) => {
                if (item !== representativeItem) {
                    item.mesh.position.copy(item.homePosition);
                }
            });
            cascade.isExtended = false;

            if (representativeItem) {
                const isBatteryRack = component === components.BatteryRack;
                const isBms = component === components.BMS;
                const isPairedBatteryPresentation = isBatteryRack || isBms;
                cascade.mobilePresentation = {
                    item: representativeItem,
                    startPosition: representative.position.clone(),
                    targetPosition: isSelected
                        ? getMobileObjectPresentationPosition(
                            representative,
                            isBatteryRack ? -0.27 : isBms ? 0.27 : 0,
                            isPairedBatteryPresentation
                                ? 0.19
                                : MOBILE_COMPONENT_VIEWPORT_HEIGHT
                        )
                        : representativeItem.homePosition.clone(),
                    startedAt: performance.now(),
                    durationMs: INSPECT_TRANSITION_DURATION_MS,
                };
            }
            return;
        }

        if (component.cascade.mobilePresentation) {
            const presentation = component.cascade.mobilePresentation;
            presentation.item.mesh.position.copy(presentation.item.homePosition);
            component.cascade.mobilePresentation = null;
        }

        component.cascade.isExtended = isSelected;
        component.cascade.transitionStartedAt = performance.now();
        component.cascade.animatedItems.forEach((item) => {
            item.startValue = item.mesh.position[component.cascade.movementAxis];
        });
        return;
    }

    component.targetPosition.copy(
        isSelected
            ? getComponentPresentationPosition(component)
            : component.homePosition
    );
}

function easeInOutCubic(value) {
    return value < 0.5
        ? 4 * value * value * value
        : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function getInspectionSubjects(component) {
    if (component.inspectWholeAssembly) {
        return [component.animatedObject];
    }

    if (component.cascade) {
        const representative = component.cascade.animatedItems
            .map((item) => item.mesh)
            .sort((a, b) => a.name.localeCompare(
                b.name,
                undefined,
                { numeric: true }
            ))[0];
        return representative ? [representative] : [];
    }

    if (component.animatedObject.isMesh) {
        return [component.animatedObject];
    }

    let representative = null;
    component.animatedObject.traverse((object) => {
        if (!representative && object.isMesh) representative = object;
    });

    return representative ? [representative] : [];
}

function setEnvironmentIsolation(session, progress) {
    renderer.toneMappingExposure = THREE.MathUtils.lerp(
        session.originalExposure,
        INSPECT_SCENE_EXPOSURE,
        progress
    );
    session.spotlight.intensity = THREE.MathUtils.lerp(
        0,
        INSPECT_SPOTLIGHT_INTENSITY,
        progress
    );

    scene.background.copy(session.backgroundColour).lerp(
        INSPECT_BACKGROUND_COLOUR,
        progress
    );
}

function restoreInspectionLighting(session) {
    renderer.toneMappingExposure = session.originalExposure;
    scene.background.copy(session.backgroundColour);
}

function enterInspectionMode() {
    if (
        applicationState !== ApplicationState.COMPONENT_SELECTED ||
        !selectedComponent ||
        !modelRoot
    ) return;

    const component = components[selectedComponent];
    if (component.focus === Focus.LOCO) return;

    const subjects = getInspectionSubjects(component);
    const subjectBounds = new THREE.Box3();

    subjects.forEach((subject) => {
        subject.updateWorldMatrix(true, true);
        subjectBounds.expandByObject(subject);
    });

    if (subjectBounds.isEmpty()) return;

    const centre = subjectBounds.getCenter(new THREE.Vector3());
    const sphere = subjectBounds.getBoundingSphere(new THREE.Sphere());
    const pivot = new THREE.Group();
    const originalTransforms = subjects.map((subject) => ({
        subject,
        parent: subject.parent,
        siblingIndex: subject.parent.children.indexOf(subject),
        position: subject.position.clone(),
        quaternion: subject.quaternion.clone(),
        scale: subject.scale.clone(),
    }));

    pivot.position.copy(centre);
    scene.add(pivot);
    pivot.updateWorldMatrix(true, false);
    subjects.forEach((subject) => pivot.attach(subject));

    const displayDirection = new THREE.Vector3(
        INSPECT_SCREEN_POSITION.x,
        INSPECT_SCREEN_POSITION.y,
        0.5
    )
        .unproject(camera)
        .sub(camera.position)
        .normalize();
    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const displayDistance = Math.max(
        (sphere.radius * INSPECT_SCALE) / (Math.tan(verticalFov / 2) * 0.58),
        1.6
    );
    const targetPosition = camera.position
        .clone()
        .add(displayDirection.multiplyScalar(displayDistance));
    const directionToCamera = camera.position
        .clone()
        .sub(targetPosition)
        .normalize();
    const cameraUp = new THREE.Vector3(0, 1, 0)
        .applyQuaternion(camera.quaternion);
    const cameraRight = new THREE.Vector3(1, 0, 0)
        .applyQuaternion(camera.quaternion);
    const spotlight = new THREE.SpotLight(
        0xffffff,
        0,
        0,
        Math.PI / 5,
        0.7,
        0
    );

    spotlight.position.copy(targetPosition)
        .add(directionToCamera.clone().multiplyScalar(Math.max(sphere.radius * 6, 2.5)))
        .add(cameraUp.clone().multiplyScalar(Math.max(sphere.radius * 1.5, 0.5)))
        .add(cameraRight.clone().multiplyScalar(Math.max(sphere.radius, 0.35)));
    spotlight.target = pivot;
    scene.add(spotlight);

    const rimSpotlight = new THREE.SpotLight(
        0xdde8ff,
        0,
        0,
        Math.PI / 6,
        0.65,
        0
    );

    rimSpotlight.position.copy(targetPosition)
        .add(directionToCamera.clone().multiplyScalar(-Math.max(sphere.radius * 4, 2)))
        .add(cameraUp.clone().multiplyScalar(Math.max(sphere.radius * 2.5, 0.8)))
        .add(cameraRight.clone().multiplyScalar(-Math.max(sphere.radius * 2, 0.7)));
    rimSpotlight.target = pivot;
    scene.add(rimSpotlight);

    component.animationPaused = true;
    outlinePass.selectedObjects = [];
    hoveredComponent = null;

    inspectSession = {
        component,
        subjects,
        pivot,
        originalTransforms,
        homePosition: pivot.position.clone(),
        homeQuaternion: pivot.quaternion.clone(),
        homeScale: pivot.scale.clone(),
        startPosition: pivot.position.clone(),
        startQuaternion: pivot.quaternion.clone(),
        startScale: pivot.scale.clone(),
        targetPosition,
        targetScale: new THREE.Vector3(
            INSPECT_SCALE,
            INSPECT_SCALE,
            INSPECT_SCALE
        ),
        spotlight,
        rimSpotlight,
        originalExposure: renderer.toneMappingExposure,
        backgroundColour: scene.background.clone(),
        progress: 0,
        phase: "scrolling",
        transitionStartedAt: performance.now(),
        lastFrameAt: performance.now(),
        closePanelAfterExit: false,
    };

    applicationState = ApplicationState.INSPECT_MODE;
}

function setInspectionScrollProgress(progress) {
    if (!inspectSession || inspectSession.phase === "exiting") return;

    const session = inspectSession;
    const previousProgress = session.progress;
    const nextProgress = THREE.MathUtils.clamp(progress, 0, 1);

    // Once fully inspected, continued downward scrolling should leave the
    // display rotation untouched rather than reapplying the home quaternion.
    if (
        session.phase === "active" &&
        previousProgress === 1 &&
        nextProgress === 1
    ) return;

    session.progress = nextProgress;
    const easedProgress = easeInOutCubic(session.progress);

    session.pivot.position.lerpVectors(
        session.startPosition,
        session.targetPosition,
        easedProgress
    );
    session.pivot.scale.lerpVectors(
        session.startScale,
        session.targetScale,
        easedProgress
    );

    if (session.rotationExitStartQuaternion) {
        session.pivot.quaternion.slerpQuaternions(
            session.homeQuaternion,
            session.rotationExitStartQuaternion,
            easedProgress
        );
    } else {
        session.pivot.quaternion.copy(session.homeQuaternion);
    }

    setEnvironmentIsolation(session, easedProgress);

    if (session.progress === 1) {
        if (previousProgress < 1) {
            session.phase = "active";
            session.lastFrameAt = performance.now();
            session.rimLightStartedAt = session.lastFrameAt;
            outlinePass.selectedObjects = session.subjects;
        }
        return;
    }

    session.phase = "scrolling";
    session.rimSpotlight.intensity = 0;
    outlinePass.selectedObjects = [];

    if (session.progress === 0) finishInspectionExit();
}

function setInspectionProgressFromPanelScroll(scrollTop) {
    if (isMobileExperience()) return;
    if (currentFocus === Focus.CHARGER) return;

    const selected = selectedComponent
        ? components[selectedComponent]
        : null;

    if (selected?.focus === Focus.LOCO) return;

    if (scrollTop > 0 && applicationState === ApplicationState.COMPONENT_SELECTED) {
        enterInspectionMode();
    }

    if (
        applicationState !== ApplicationState.INSPECT_MODE ||
        !inspectSession ||
        inspectSession.phase === "exiting"
    ) return;

    const nextProgress = THREE.MathUtils.clamp(
        scrollTop / INSPECT_SCROLL_DISTANCE_PX,
        0,
        1
    );

    if (nextProgress < 1 && inspectSession.progress === 1) {
        inspectSession.rotationExitStartQuaternion =
            inspectSession.pivot.quaternion.clone();
    }

    setInspectionScrollProgress(nextProgress);
}

function exitInspectionMode(closePanelAfterExit = false) {
    if (inspectSession?.phase === "exiting") {
        inspectSession.closePanelAfterExit ||= closePanelAfterExit;
        return;
    }

    if (
        applicationState !== ApplicationState.INSPECT_MODE ||
        !inspectSession ||
        inspectSession.phase === "exiting"
    ) return;

    inspectSession.phase = "exiting";
    outlinePass.selectedObjects = [];
    inspectSession.transitionStartedAt = performance.now();
    inspectSession.exitStartPosition = inspectSession.pivot.position.clone();
    inspectSession.exitStartQuaternion = inspectSession.pivot.quaternion.clone();
    inspectSession.exitStartScale = inspectSession.pivot.scale.clone();
    inspectSession.exitExposure = renderer.toneMappingExposure;
    inspectSession.exitSpotlightIntensity = inspectSession.spotlight.intensity;
    inspectSession.exitRimSpotlightIntensity =
        inspectSession.rimSpotlight.intensity;
    inspectSession.exitBackgroundColour = scene.background.clone();
    inspectSession.closePanelAfterExit = closePanelAfterExit;
}

function finishInspectionExit() {
    const session = inspectSession;

    outlinePass.selectedObjects = [];

    session.originalTransforms
      .slice()
      .sort((a, b) =>
          a.parent === b.parent ? a.siblingIndex - b.siblingIndex : 0
      )
      .forEach((transform) => {
        transform.parent.add(transform.subject);
        transform.subject.position.copy(transform.position);
        transform.subject.quaternion.copy(transform.quaternion);
        transform.subject.scale.copy(transform.scale);

        const siblings = transform.parent.children;
        const currentIndex = siblings.indexOf(transform.subject);
        siblings.splice(currentIndex, 1);
        siblings.splice(transform.siblingIndex, 0, transform.subject);
      });

    scene.remove(session.pivot);
    scene.remove(session.spotlight);
    scene.remove(session.rimSpotlight);
    restoreInspectionLighting(session);
    session.component.animationPaused = false;
    inspectSession = null;
    applicationState = ApplicationState.COMPONENT_SELECTED;

    if (pendingComponentNavigation) {
        const targetNavigation = pendingComponentNavigation;
        pendingComponentNavigation = null;
        activateComponentNavigation(targetNavigation);
        return;
    }

    if (session.closePanelAfterExit) {
        setSelectionGroupSelectedState(selectedComponent, false);
        selectedComponent = null;
        applicationState = ApplicationState.CONTAINER_OPEN;
        closePanel();

        if (pendingFocusAfterInspectionExit) {
            pendingFocusTransition = {
                targetFocus: pendingFocusAfterInspectionExit,
                returningComponent: session.component,
            };
            pendingFocusAfterInspectionExit = null;
        }
    }
}

function updateInspectionMode(now) {
    if (!inspectSession) return;

    const session = inspectSession;

    if (session.phase === "active") {
        const deltaSeconds = Math.min((now - session.lastFrameAt) / 1000, 0.1);
        const rimLightProgress = THREE.MathUtils.clamp(
            (now - session.rimLightStartedAt) / INSPECT_RIM_LIGHT_FADE_MS,
            0,
            1
        );
        session.rimSpotlight.intensity = THREE.MathUtils.lerp(
            0,
            INSPECT_RIM_SPOTLIGHT_INTENSITY,
            easeInOutCubic(rimLightProgress)
        );
        session.pivot.rotateY(
            (Math.PI * 2 * deltaSeconds) / (INSPECT_ROTATION_DURATION_MS / 1000)
        );
        session.lastFrameAt = now;
        return;
    }

    if (session.phase !== "exiting") return;

    const elapsed = now - session.transitionStartedAt;
    const progress = THREE.MathUtils.clamp(
        elapsed / INSPECT_TRANSITION_DURATION_MS,
        0,
        1
    );
    const easedProgress = easeInOutCubic(progress);

    session.pivot.position.lerpVectors(
        session.exitStartPosition,
        session.homePosition,
        easedProgress
    );
    session.pivot.quaternion.slerpQuaternions(
        session.exitStartQuaternion,
        session.homeQuaternion,
        easedProgress
    );
    session.pivot.scale.lerpVectors(
        session.exitStartScale,
        session.homeScale,
        easedProgress
    );
    renderer.toneMappingExposure = THREE.MathUtils.lerp(
        session.exitExposure,
        session.originalExposure,
        easedProgress
    );
    session.spotlight.intensity = THREE.MathUtils.lerp(
        session.exitSpotlightIntensity,
        0,
        easedProgress
    );
    session.rimSpotlight.intensity = THREE.MathUtils.lerp(
        session.exitRimSpotlightIntensity,
        0,
        easedProgress
    );
    scene.background.copy(session.exitBackgroundColour).lerp(
        session.backgroundColour,
        easedProgress
    );

    if (progress === 1) finishInspectionExit();
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

    if (applicationState === ApplicationState.INSPECT_MODE) return;

    const component = components[name];

    if(!component) return;

    // Battery Rack and BMS are two entry points into one linked system. Moving
    // between those meshes changes the inspection subject without replaying
    // or cancelling their shared presentation.
    if (
        selectedComponent &&
        selectedComponent !== name &&
        selectionGroupsMatch(selectedComponent, name)
    ) {
        selectedComponent = name;
        applicationState = ApplicationState.COMPONENT_SELECTED;
        updateComponentNavigationPosition(name);
        return;
    }

    // Clicking the selected component deselects its complete selection group.
    if(selectedComponent === name) {

        setSelectionGroupSelectedState(name, false);
        lockComponentInteractions(name);

        selectedComponent = null;

        applicationState = ApplicationState.CONTAINER_OPEN;

        document.dispatchEvent(new CustomEvent("panelClosed"));

        return;

    }

    const previousComponent = selectedComponent;

    // Return previously selected component
    if(selectedComponent) {

        setSelectionGroupSelectedState(selectedComponent, false);

    }

    // Select the new component
    setSelectionGroupSelectedState(name, true);

    selectedComponent = name;

    applicationState = ApplicationState.COMPONENT_SELECTED;
    updateComponentNavigationPosition(name);
    lockComponentInteractions(previousComponent, name);

}

function activateComponentNavigation(navigationItem) {
    if (!navigationItem || !components[navigationItem.component]) return;

    selectComponent(navigationItem.component);
    hoveredComponent = null;
    outlinePass.selectedObjects = [];

    if (selectedComponent) openPanel(navigationItem.panel);
}

function navigateSelectedComponent(direction) {
    if (componentInteractionsAreLocked()) return;

    const cycle = COMPONENT_NAVIGATION[currentFocus];
    if (!cycle?.length || !selectedComponent) return;

    const currentIndex = cycle.findIndex((item) =>
        item.component === selectedComponent ||
        item.aliases?.includes(selectedComponent)
    );
    if (currentIndex < 0) return;

    const step = direction < 0 ? -1 : 1;
    const nextIndex = (currentIndex + step + cycle.length) % cycle.length;
    const nextNavigation = cycle[nextIndex];

    if (applicationState === ApplicationState.INSPECT_MODE) {
        pendingComponentNavigation = nextNavigation;
        exitInspectionMode(false);
        return;
    }

    activateComponentNavigation(nextNavigation);
}

// Click Components
function handleClick(objectName) {

    // First click enters the experience
    if (applicationState === ApplicationState.OVERVIEW) {

        if (!modelIsReady || !environmentIsReady || experienceLoadFailed) return;

        applicationState = ApplicationState.CONTAINER_OPEN;

        introTransitionStartedAt = performance.now();
        introPrompt.classList.add("is-hidden");
        document.body.classList.remove("intro-active");

        enclosureTargetY = enclosureHomeY + getContainerOpenLift();

        cameraTargetPosition.copy(betCameraPosition);
        cameraTargetLookAt.copy(betLookTarget);

        return;

    }

    // Wait until the camera has arrived
    const activeCameraPosition = currentFocus === Focus.BET
        ? betCameraPosition
        : locoCameraPosition;

    if (
        !isMobileExperience() &&
        camera.position.distanceTo(activeCameraPosition) >= 0.05
    ) return;

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
          openPanel("battery");
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

  }
}

function updateFocusButtons() {
  const betIsActive = currentFocus === Focus.BET;
  const locoIsActive = currentFocus === Focus.LOCO;
  const chargerIsActive = currentFocus === Focus.CHARGER;

  betButton.classList.toggle("active", betIsActive);
  locoButton.classList.toggle("active", locoIsActive);
  chargerButton.classList.toggle("active", chargerIsActive);
  locoButton.classList.toggle("is-disabled", chargerIsActive);
  locoButton.setAttribute("aria-disabled", String(chargerIsActive));
  chargerButton.classList.toggle("is-disabled", locoIsActive);
  chargerButton.setAttribute("aria-disabled", String(locoIsActive));

  betButton.src = betIsActive ? "BETButtonActive.svg" : "BETButton.svg";
  locoButton.src = locoIsActive ? "LocoButtonActive.svg" : "LocoButton.svg";
  chargerButton.src = chargerIsActive
    ? "ChargingButtonActive.svg"
    : "ChargingButton.svg";
}

function setupChargingGun(model) {
  const gun = model.getObjectByName("Gun");
  const gunPlugTip = model.getObjectByName("GunPlugTip");
  const gunTarget = model.getObjectByName("GunTarget");
  const cableConnection = model.getObjectByName("CableConnection");
  const cableSupplyAnchor = model.getObjectByName("CableSupplyAnchor");

  if (
    !gun ||
    !gunPlugTip ||
    !gunTarget ||
    !cableConnection ||
    !cableSupplyAnchor ||
    !gun.parent
  ) {
    console.warn("Charging gun animation nodes are incomplete.");
    return;
  }

  model.updateWorldMatrix(true, true);
  gunPlugTip.updateMatrix();
  cableConnection.updateMatrix();

  const targetGunLocalMatrix = new THREE.Matrix4()
    .copy(gun.parent.matrixWorld)
    .invert()
    .multiply(gunTarget.matrixWorld)
    .multiply(gunPlugTip.matrix.clone().invert());
  const targetPosition = new THREE.Vector3();
  const targetQuaternion = new THREE.Quaternion();
  const targetScale = new THREE.Vector3();
  targetGunLocalMatrix.decompose(
    targetPosition,
    targetQuaternion,
    targetScale
  );

  // The Blender-authored Gun pose is the plugged-in display pose. Build the
  // hidden/resting pose by placing its cable outlet on the off-screen supply
  // anchor, while preserving the authored orientation and scale.
  const homeQuaternion = gun.quaternion.clone();
  const homeScale = gun.scale.clone();
  const anchorPosition = cableSupplyAnchor.getWorldPosition(new THREE.Vector3());
  const anchorInGunParent = gun.parent.worldToLocal(anchorPosition.clone());
  const cableConnectionOffset = cableConnection.position.clone()
    .multiply(homeScale)
    .applyQuaternion(homeQuaternion);
  const homePosition = anchorInGunParent.sub(cableConnectionOffset);
  const approachDirection = homePosition.clone()
    .sub(targetPosition)
    .normalize();
  const approachPosition = targetPosition.clone()
    .add(approachDirection.multiplyScalar(0.55));
  const controlPosition = homePosition.clone()
    .lerp(approachPosition, 0.52);
  controlPosition.y += Math.max(homePosition.distanceTo(targetPosition) * 0.18, 0.8);

  const finalGunWorldMatrix = new THREE.Matrix4()
    .multiplyMatrices(gun.parent.matrixWorld, targetGunLocalMatrix);
  const finalCableWorldPosition = new THREE.Vector3().setFromMatrixPosition(
    new THREE.Matrix4().multiplyMatrices(
      finalGunWorldMatrix,
      cableConnection.matrix
    )
  );
  gun.position.copy(homePosition);
  gun.quaternion.copy(homeQuaternion);
  gun.scale.copy(homeScale);
  gun.updateWorldMatrix(true, true);

  const homeCablePosition = cableConnection.getWorldPosition(new THREE.Vector3());
  const maximumEndpointDistance = Math.max(
    anchorPosition.distanceTo(homeCablePosition),
    anchorPosition.distanceTo(finalCableWorldPosition)
  );
  // Extra slack gives the cable enough weight to hang and trail naturally.
  const cableLength = maximumEndpointDistance * 1.28;
  const segmentLength = cableLength / (CHARGING_CABLE_POINT_COUNT - 1);
  const ropePoints = [];
  const previousRopePoints = [];

  for (let index = 0; index < CHARGING_CABLE_POINT_COUNT; index += 1) {
    const progress = index / (CHARGING_CABLE_POINT_COUNT - 1);
    const point = anchorPosition.clone().lerp(homeCablePosition, progress);
    point.y -= Math.sin(progress * Math.PI) * Math.max(cableLength * 0.12, 0.25);
    ropePoints.push(point);
    previousRopePoints.push(point.clone());
  }

  const cableCurve = new THREE.CatmullRomCurve3(ropePoints.map((point) => point.clone()));
  const cableMaterial = new THREE.MeshStandardMaterial({
    color: 0x050505,
    roughness: 0.78,
    metalness: 0.04,
  });
  const cableFlowUniforms = {
    time: { value: 0 },
    opacity: { value: 0 },
  };
  cableMaterial.defines = { USE_UV: "" };
  cableMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.cableFlowTime = cableFlowUniforms.time;
    shader.uniforms.cableFlowOpacity = cableFlowUniforms.opacity;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform float cableFlowTime;
        uniform float cableFlowOpacity;`
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        float cableFlowPhase = fract(vUv.x * 3.0 - cableFlowTime * 0.85);
        float cableFlowPulse = 1.0 - smoothstep(0.0, 0.14, cableFlowPhase);
        cableFlowPulse += 0.28 * (
          1.0 - smoothstep(0.0, 0.34, cableFlowPhase)
        );
        totalEmissiveRadiance += vec3(0.02, 0.38, 1.0)
          * cableFlowPulse * cableFlowOpacity;`
      );
  };
  cableMaterial.customProgramCacheKey = () => "charging-cable-flow-v1";
  const cableMesh = new THREE.Mesh(
    new THREE.TubeGeometry(
      cableCurve,
      36,
      CHARGING_CABLE_RADIUS,
      6,
      false
    ),
    cableMaterial
  );
  cableMesh.name = "SimulatedChargingCable";
  cableMesh.frustumCulled = false;
  scene.add(cableMesh);

  chargingGunSession = {
    gun,
    cableConnection,
    cableSupplyAnchor,
    cableMesh,
    cableFlowUniforms,
    ropePoints,
    previousRopePoints,
    segmentLength,
    homePosition,
    homeQuaternion,
    homeScale,
    targetPosition,
    targetQuaternion,
    targetScale,
    approachPosition,
    controlPosition,
    progress: 0,
    transitionStartProgress: 0,
    transitionTargetProgress: 0,
    transitionStartedAt: performance.now(),
    transitionDurationMs: CHARGING_GUN_TRANSITION_MS,
    lastFrameAt: performance.now(),
    lastCableGeometryUpdateAt: 0,
  };
}

function setChargingGunPlugged(isPlugged) {
  if (!chargingGunSession) return;

  const targetProgress = isPlugged ? 1 : 0;
  if (chargingGunSession.transitionTargetProgress === targetProgress) return;

  chargingGunSession.transitionStartProgress = chargingGunSession.progress;
  chargingGunSession.transitionTargetProgress = targetProgress;
  chargingGunSession.transitionStartedAt = performance.now();
  chargingGunSession.transitionDurationMs = Math.max(
    CHARGING_GUN_TRANSITION_MS * Math.abs(
      targetProgress - chargingGunSession.progress
    ),
    320
  );
}

function getChargingGunPosition(session, progress, target) {
  const approachEnd = 0.84;

  if (progress < approachEnd) {
    const pathProgress = easeInOutCubic(progress / approachEnd);
    const inverse = 1 - pathProgress;
    target.copy(session.homePosition).multiplyScalar(inverse * inverse)
      .add(session.controlPosition.clone().multiplyScalar(
        2 * inverse * pathProgress
      ))
      .add(session.approachPosition.clone().multiplyScalar(
        pathProgress * pathProgress
      ));
    return target;
  }

  const insertionProgress = easeInOutCubic(
    (progress - approachEnd) / (1 - approachEnd)
  );
  return target.lerpVectors(
    session.approachPosition,
    session.targetPosition,
    insertionProgress
  );
}

function constrainChargingCable(session, anchor, endpoint) {
  const points = session.ropePoints;
  const lastIndex = points.length - 1;

  points[0].copy(anchor);
  points[lastIndex].copy(endpoint);

  for (let iteration = 0; iteration < 6; iteration += 1) {
    points[0].copy(anchor);
    points[lastIndex].copy(endpoint);

    for (let index = 0; index < lastIndex; index += 1) {
      const first = points[index];
      const second = points[index + 1];
      const delta = second.clone().sub(first);
      const distance = Math.max(delta.length(), 0.0001);
      const correction = delta.multiplyScalar(
        (distance - session.segmentLength) / distance
      );

      if (index === 0) {
        second.sub(correction);
      } else if (index + 1 === lastIndex) {
        first.add(correction);
      } else {
        first.addScaledVector(correction, 0.5);
        second.addScaledVector(correction, -0.5);
      }
    }
  }

  points[0].copy(anchor);
  points[lastIndex].copy(endpoint);
}

function updateChargingGun(now) {
  const session = chargingGunSession;
  if (!session) return;

  const transitionElapsed = now - session.transitionStartedAt;
  const transitionProgress = THREE.MathUtils.clamp(
    transitionElapsed / session.transitionDurationMs,
    0,
    1
  );
  session.progress = THREE.MathUtils.lerp(
    session.transitionStartProgress,
    session.transitionTargetProgress,
    easeInOutCubic(transitionProgress)
  );

  getChargingGunPosition(session, session.progress, session.gun.position);
  session.gun.quaternion.slerpQuaternions(
    session.homeQuaternion,
    session.targetQuaternion,
    easeInOutCubic(session.progress)
  );
  session.gun.scale.lerpVectors(
    session.homeScale,
    session.targetScale,
    easeInOutCubic(session.progress)
  );
  session.gun.updateWorldMatrix(true, true);

  const deltaSeconds = Math.min((now - session.lastFrameAt) / 1000, 0.033);
  session.lastFrameAt = now;
  const lastIndex = session.ropePoints.length - 1;
  const anchorPosition = session.cableSupplyAnchor.getWorldPosition(
    new THREE.Vector3()
  );
  const endpointPosition = session.cableConnection.getWorldPosition(
    new THREE.Vector3()
  );

  for (let index = 1; index < lastIndex; index += 1) {
    const point = session.ropePoints[index];
    const previous = session.previousRopePoints[index];
    // Strong damping and increased gravity make the cable feel heavy instead
    // of springy, while its fixed endpoints keep it securely attached.
    const velocity = point.clone().sub(previous).multiplyScalar(0.91);
    previous.copy(point);
    point.add(velocity);
    point.y -= 7.5 * deltaSeconds * deltaSeconds;
  }

  constrainChargingCable(session, anchorPosition, endpointPosition);

  session.cableFlowUniforms.time.value = now * 0.001;
  const cableFlowTarget = chargingStage === ChargingStage.PLUGIN ? 1 : 0;
  session.cableFlowUniforms.opacity.value = THREE.MathUtils.lerp(
    session.cableFlowUniforms.opacity.value,
    cableFlowTarget,
    0.08
  );

  if (now - session.lastCableGeometryUpdateAt >= 16) {
    const cableCurve = new THREE.CatmullRomCurve3(
      session.ropePoints.map((point) => point.clone())
    );
    const previousGeometry = session.cableMesh.geometry;
    session.cableMesh.geometry = new THREE.TubeGeometry(
      cableCurve,
      36,
      CHARGING_CABLE_RADIUS,
      6,
      false
    );
    previousGeometry.dispose();
    session.lastCableGeometryUpdateAt = now;
  }
}

function setChargingStage(nextStage) {
  if (!Object.values(ChargingStage).includes(nextStage)) return;

  chargingStage = nextStage;
  if (pantograph) {
    pantographTargetY = nextStage === ChargingStage.ROOFTOP
      ? pantographHomeY
      : pantographHomeY + PANTOGRAPH_REGEN_LIFT;
  }
  setChargingGunPlugged(nextStage === ChargingStage.PLUGIN);
}

function applyFocusMode(targetFocus) {
  const previousFocus = currentFocus;

  if (targetFocus === Focus.BET) {
    const isLeavingCharger = previousFocus === Focus.CHARGER;
    if (isLeavingCharger) setChargingStage(ChargingStage.ROOFTOP);

    currentFocus = Focus.BET;
    chargerTargetY = CHARGER_HIDDEN_Y;
    enclosureTargetY = enclosureHomeY + getContainerOpenLift();
    synchronizedChargeLift = isLeavingCharger && charger && enclosure
      ? {
          startedAt: performance.now(),
          chargerStartY: charger.position.y,
          enclosureStartY: enclosure.position.y,
        }
      : null;
    cameraTargetPosition.copy(betCameraPosition);
    cameraTargetLookAt.copy(betLookTarget);
    cameraTargetFov = BET_CAMERA_FOV;
    applicationState = ApplicationState.CONTAINER_OPEN;
  } else if (targetFocus === Focus.LOCO) {
    currentFocus = Focus.LOCO;
    chargerTargetY = CHARGER_HIDDEN_Y;
    enclosureTargetY = enclosureHomeY + getContainerOpenLift();
    synchronizedChargeLift = null;
    cameraTargetPosition.copy(locoCameraPosition);
    cameraTargetLookAt.copy(locoLookTarget);
    cameraTargetFov = LOCO_CAMERA_FOV;
    applicationState = ApplicationState.CONTAINER_OPEN;
  } else if (targetFocus === Focus.CHARGER) {
    synchronizedChargeLift = null;
    currentFocus = Focus.CHARGER;
    setChargingStage(ChargingStage.ROOFTOP);
    enclosureTargetY = enclosureHomeY;
    chargerTargetY = chargerHomeY;
    cameraTargetPosition.copy(betCameraPosition);
    cameraTargetLookAt.copy(betLookTarget);
    cameraTargetFov = BET_CAMERA_FOV;
    applicationState = ApplicationState.COMPONENT_SELECTED;
    openPanel("charger");
  }

  updateFocusButtons();
}

function componentHasReturnedHome(component, now) {
  if (!component) return true;

  if (component.cascade) {
    const cascade = component.cascade;
    if (isMobileExperience() && cascade.mobilePresentation) {
      return cascade.mobilePresentation.item.mesh.position.distanceTo(
        cascade.mobilePresentation.item.homePosition
      ) < 0.02;
    }
    const totalDuration = cascade.slideDurationMs +
      cascade.delayMs * Math.max(cascade.animatedItems.length - 1, 0);
    return !cascade.isExtended &&
      now - cascade.transitionStartedAt >= totalDuration;
  }

  return component.animatedObject.position.distanceTo(component.homePosition) < 0.02;
}

function requestFocusMode(targetFocus) {
  if (pendingFocusTransition || pendingFocusAfterInspectionExit) return;
  if (targetFocus === currentFocus) return;

  const transitionIsDisabled =
    (currentFocus === Focus.CHARGER && targetFocus === Focus.LOCO) ||
    (currentFocus === Focus.LOCO && targetFocus === Focus.CHARGER);
  if (transitionIsDisabled) return;

  if (applicationState === ApplicationState.INSPECT_MODE) {
    pendingFocusAfterInspectionExit = targetFocus;
    exitInspectionMode(true);
    return;
  }

  if (applicationState === ApplicationState.COMPONENT_SELECTED) {
    closePanel();

    if (selectedComponent) {
      const returningComponent = components[selectedComponent];
      setSelectionGroupSelectedState(selectedComponent, false);
      selectedComponent = null;
      applicationState = ApplicationState.CONTAINER_OPEN;
      pendingFocusTransition = { targetFocus, returningComponent };
      return;
    }

    applicationState = ApplicationState.CONTAINER_OPEN;
  }

  if (applicationState !== ApplicationState.CONTAINER_OPEN) return;
  applyFocusMode(targetFocus);
}

function updatePendingFocusTransition(now) {
  if (!pendingFocusTransition) return;
  if (!componentHasReturnedHome(
    pendingFocusTransition.returningComponent,
    now
  )) return;

  const { targetFocus } = pendingFocusTransition;
  pendingFocusTransition = null;
  applyFocusMode(targetFocus);
}

//Input Events
//Mouse Move
window.addEventListener("mousemove", (event) => {

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

});

const SCENE_TAP_MOVEMENT_THRESHOLD_PX = 14;
let scenePointerDown = null;

function handleSceneTap(event) {
  if (pendingFocusTransition || pendingFocusAfterInspectionExit) return;
  if (applicationState === ApplicationState.INSPECT_MODE) return;

  // First click always enters the experience
  if (applicationState === ApplicationState.OVERVIEW) {
    handleClick(null);
    return;
  }

  if (componentInteractionsAreLocked()) return;

  const canvasBounds = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
  mouse.y = -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // Navigation back to BET
  if (currentFocus === Focus.LOCO) {
    const navHits = raycaster.intersectObjects(betNavigationMeshes, true);

    if (navHits.length > 0) {
      currentFocus = Focus.BET;

      cameraTargetPosition.copy(betCameraPosition);
      cameraTargetLookAt.copy(betLookTarget);
      cameraTargetFov = BET_CAMERA_FOV;

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
}

renderer.domElement.addEventListener("pointerdown", (event) => {
  if (!event.isPrimary) return;

  scenePointerDown = {
    pointerId: event.pointerId,
    clientX: event.clientX,
    clientY: event.clientY,
  };
});

renderer.domElement.addEventListener("pointercancel", (event) => {
  if (scenePointerDown?.pointerId === event.pointerId) {
    scenePointerDown = null;
  }
});

renderer.domElement.addEventListener("pointerup", (event) => {
  if (
    !event.isPrimary ||
    !scenePointerDown ||
    scenePointerDown.pointerId !== event.pointerId
  ) return;

  const movement = Math.hypot(
    event.clientX - scenePointerDown.clientX,
    event.clientY - scenePointerDown.clientY
  );
  scenePointerDown = null;

  if (movement > SCENE_TAP_MOVEMENT_THRESHOLD_PX) return;

  event.preventDefault();
  handleSceneTap(event);
});

document.addEventListener("panelClosed", () => {
  if (applicationState === ApplicationState.INSPECT_MODE) {
    exitInspectionMode(true);
    return;
  }

  if (selectedComponent) {
    setSelectionGroupSelectedState(selectedComponent, false);

    selectedComponent = null;
  }

  applicationState = ApplicationState.CONTAINER_OPEN;
  closePanel();
});

document.addEventListener("inspectionScrollChanged", (event) => {
  setInspectionProgressFromPanelScroll(event.detail.scrollTop);
});

document.addEventListener("chargingStageChanged", (event) => {
  if (currentFocus !== Focus.CHARGER) return;
  setChargingStage(event.detail.stage);
});

document.addEventListener("componentNavigationRequested", (event) => {
  navigateSelectedComponent(event.detail.direction);
});

const MOBILE_SWIPE_MIN_DISTANCE_PX = 52;
const MOBILE_SWIPE_DIRECTION_RATIO = 1.25;
let mobileSwipeStart = null;

function mobileComponentSwipeIsAvailable() {
  return (
    isMobileExperience() &&
    currentFocus !== Focus.CHARGER &&
    selectedComponent &&
    document.getElementById("infoPanel").classList.contains("open") &&
    (
      applicationState === ApplicationState.COMPONENT_SELECTED ||
      applicationState === ApplicationState.INSPECT_MODE
    )
  );
}

document.addEventListener("touchstart", (event) => {
  if (!mobileComponentSwipeIsAvailable() || event.touches.length !== 1) {
    mobileSwipeStart = null;
    return;
  }

  const touch = event.touches[0];
  mobileSwipeStart = {
    identifier: touch.identifier,
    clientX: touch.clientX,
    clientY: touch.clientY,
  };
}, { passive: true, capture: true });

document.addEventListener("touchmove", (event) => {
  if (!mobileSwipeStart || event.touches.length !== 1) return;

  const touch = event.touches[0];
  if (touch.identifier !== mobileSwipeStart.identifier) return;

  const deltaX = touch.clientX - mobileSwipeStart.clientX;
  const deltaY = touch.clientY - mobileSwipeStart.clientY;

  if (
    Math.abs(deltaX) > 12 &&
    Math.abs(deltaX) > Math.abs(deltaY) * MOBILE_SWIPE_DIRECTION_RATIO
  ) {
    event.preventDefault();
  }
}, { passive: false, capture: true });

document.addEventListener("touchend", (event) => {
  if (!mobileSwipeStart) return;

  const touch = Array.from(event.changedTouches).find(
    (changedTouch) => changedTouch.identifier === mobileSwipeStart.identifier
  );
  if (!touch) return;

  const deltaX = touch.clientX - mobileSwipeStart.clientX;
  const deltaY = touch.clientY - mobileSwipeStart.clientY;
  mobileSwipeStart = null;

  const isHorizontalSwipe =
    Math.abs(deltaX) >= MOBILE_SWIPE_MIN_DISTANCE_PX &&
    Math.abs(deltaX) > Math.abs(deltaY) * MOBILE_SWIPE_DIRECTION_RATIO;

  if (!isHorizontalSwipe || !mobileComponentSwipeIsAvailable()) return;

  // Swiping the content left advances; swiping right goes back.
  navigateSelectedComponent(deltaX < 0 ? 1 : -1);
}, { passive: true, capture: true });

document.addEventListener("touchcancel", () => {
  mobileSwipeStart = null;
}, { passive: true, capture: true });

document.addEventListener("keydown", (event) => {
  if (isMobileExperience()) return;
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  if (!selectedComponent || currentFocus === Focus.CHARGER) return;
  if (!document.getElementById("infoPanel").classList.contains("open")) return;
  if (componentInteractionsAreLocked()) return;

  const target = event.target;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target?.isContentEditable
  ) return;

  event.preventDefault();
  navigateSelectedComponent(event.key === "ArrowLeft" ? -1 : 1);
});

window.addEventListener("resize", () => {
  resizeRenderPipeline();
});

betButton.addEventListener("click", () => {
  requestFocusMode(Focus.BET);
});

locoButton.addEventListener("click", () => {
  requestFocusMode(Focus.LOCO);
});

chargerButton.addEventListener("click", () => {
  if (!charger) return;
  requestFocusMode(Focus.CHARGER);
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
  const now = performance.now();

  // Animate components
  for (const component of Object.values(components)) {
    if (component.animationPaused) continue;

    if (component.cascade) {
      const cascade = component.cascade;

      if (isMobileExperience() && cascade.mobilePresentation) {
        const presentation = cascade.mobilePresentation;
        const progress = THREE.MathUtils.clamp(
          (now - presentation.startedAt) / presentation.durationMs,
          0,
          1
        );
        presentation.item.mesh.position.lerpVectors(
          presentation.startPosition,
          presentation.targetPosition,
          easeInOutCubic(progress)
        );
        continue;
      }

      const elapsed = now - cascade.transitionStartedAt;
      const itemCount = cascade.animatedItems.length;

      cascade.animatedItems.forEach((item, index) => {
        const cascadeIndex = cascade.isExtended
          ? index
          : itemCount - index - 1;
        const itemElapsed = elapsed - cascadeIndex * cascade.delayMs;
        const progress = THREE.MathUtils.clamp(
          itemElapsed / cascade.slideDurationMs,
          0,
          1
        );
        const easedProgress = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        const targetValue = item.homeValue +
          (cascade.isExtended ? cascade.movementDistance : 0);

        item.mesh.position[cascade.movementAxis] = THREE.MathUtils.lerp(
          item.startValue,
          targetValue,
          easedProgress
        );
      });

      continue;
    }

    component.animatedObject.position.lerp(component.targetPosition, 0.08);
  }

  updatePendingFocusTransition(now);

  if (synchronizedChargeLift && enclosure && charger) {
    const liftProgress = THREE.MathUtils.clamp(
      (now - synchronizedChargeLift.startedAt) / CHARGE_LIFT_DURATION_MS,
      0,
      1
    );
    const easedLiftProgress = liftProgress * liftProgress * (3 - 2 * liftProgress);

    enclosure.position.y = THREE.MathUtils.lerp(
      synchronizedChargeLift.enclosureStartY,
      enclosureTargetY,
      easedLiftProgress
    );
    charger.position.y = THREE.MathUtils.lerp(
      synchronizedChargeLift.chargerStartY,
      chargerTargetY,
      easedLiftProgress
    );

    if (liftProgress === 1) synchronizedChargeLift = null;
  } else {
    // Animate the container and charger independently for all other transitions.
    if (enclosure) {
      enclosure.position.y += (enclosureTargetY - enclosure.position.y) * 0.08;
    }

    if (charger) {
      charger.position.y += (chargerTargetY - charger.position.y) * 0.08;
    }
  }

  if (pantograph) {
    pantograph.position.y = THREE.MathUtils.lerp(
      pantograph.position.y,
      pantographTargetY,
      0.08
    );
  }

  updateChargingGun(now);

  const chargerIsConnected =
    currentFocus === Focus.CHARGER &&
    charger &&
    Math.abs(charger.position.y - chargerHomeY) < 0.08;

  if (pantographFlowMaterial) {
    pantographFlowMaterial.uniforms.time.value = now * 0.001;
    const flowTargetOpacity =
      chargerIsConnected && chargingStage === ChargingStage.ROOFTOP
        ? 0.9
        : 0;

    pantographFlowMaterial.uniforms.opacity.value = THREE.MathUtils.lerp(
      pantographFlowMaterial.uniforms.opacity.value,
      flowTargetOpacity,
      0.08
    );
  }

  if (wheelRegenFlowMaterial) {
    wheelRegenFlowMaterial.uniforms.time.value = now * 0.001;
    const regenTargetOpacity =
      chargerIsConnected && chargingStage === ChargingStage.REGENERATIVE
        ? 0.95
        : 0;

    wheelRegenFlowMaterial.uniforms.opacity.value = THREE.MathUtils.lerp(
      wheelRegenFlowMaterial.uniforms.opacity.value,
      regenTargetOpacity,
      0.08
    );
  }

  if (introTransitionStartedAt !== null) {
    const introProgress = THREE.MathUtils.clamp(
      (now - introTransitionStartedAt) / INTRO_TRANSITION_DURATION_MS,
      0,
      1
    );
    const easedIntroProgress =
      introProgress * introProgress * (3 - 2 * introProgress);

    renderer.toneMappingExposure = THREE.MathUtils.lerp(
      INTRO_SCENE_EXPOSURE,
      NORMAL_SCENE_EXPOSURE,
      easedIntroProgress
    );
    scene.background.copy(INTRO_BACKGROUND_COLOUR).lerp(
      NORMAL_BACKGROUND_COLOUR,
      easedIntroProgress
    );

    if (introProgress === 1) introTransitionStartedAt = null;
  }

  // Mobile retains one pulled-back camera throughout overview and component
  // navigation, preventing the panel or a new selection from changing zoom.
    responsiveCameraPosition.copy(cameraTargetPosition);
    responsiveCameraLookTarget.copy(cameraTargetLookAt);
    const mobileExperienceIsActive = isMobileExperience();
    if (
      mobileExperienceIsActive &&
      (
        currentFocus === Focus.BET ||
        currentFocus === Focus.LOCO ||
        currentFocus === Focus.CHARGER
      ) &&
      applicationState !== ApplicationState.OVERVIEW
    ) {
      responsiveCameraPosition
        .sub(cameraTargetLookAt)
        .multiplyScalar(
          currentFocus === Focus.CHARGER
            ? MOBILE_CHARGING_DISTANCE_SCALE
            : MOBILE_FOCUS_OVERVIEW_DISTANCE_SCALE
        )
        .add(cameraTargetLookAt);

      if (currentFocus === Focus.CHARGER) {
        responsiveCameraPosition.x += MOBILE_CHARGING_CAMERA_RIGHT_OFFSET;
        responsiveCameraPosition.y -= MOBILE_CHARGING_CAMERA_LOWER_OFFSET;
        responsiveCameraLookTarget.y -= MOBILE_CHARGING_CAMERA_LOWER_OFFSET;
        responsiveCameraLookTarget.y -= MOBILE_CHARGING_LOOK_DOWN_OFFSET;
        responsiveCameraLookTarget.x -= MOBILE_CHARGING_LOOK_LEFT_OFFSET;
      }
    }

    camera.position.lerp(responsiveCameraPosition, 0.05);
    cameraLookTarget.lerp(responsiveCameraLookTarget, 0.05);

    const responsiveCameraFov = mobileExperienceIsActive
      ? Math.max(cameraTargetFov, 60)
      : cameraTargetFov;
    const nextCameraFov = THREE.MathUtils.lerp(
      camera.fov,
      responsiveCameraFov,
      0.05
    );
    if (Math.abs(nextCameraFov - camera.fov) > 0.0001) {
      camera.fov = nextCameraFov;
      camera.updateProjectionMatrix();
    }

    camera.lookAt(cameraLookTarget);

  updateInspectionMode(now);

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
  if (applicationState === ApplicationState.INSPECT_MODE) {
    composer.render();
    return;
  }

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(getActiveMeshes(), true);

  if (intersects.length > 0) {
    const componentName = getComponentName(intersects[0].object);

    if (applicationState !== ApplicationState.OVERVIEW) {
      hoverComponent(componentName);
    }
  } else {
    if (applicationState !== ApplicationState.OVERVIEW) {
      hoverComponent(null);
    }
  }

  composer.render();
}

updateFocusButtons();
animate();
