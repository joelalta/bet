const FINAL_PANEL_CONTENT = {
  airCompressor: `
    <h1>Compressed Air Supply System</h1>
    <h2>Supporting the locomotive without relying on engine-driven air supply</h2>
    <p>The BET's two electric compressor assemblies provide compressed air to the locomotive's existing air system, supporting pneumatic functions including braking.</p>
    <p>The compressors respond to demand: one can operate independently when less air is required, while both can run together when demand increases. They receive electrical power through the Auxiliary Power System, maintaining air supply when the locomotive's diesel engine is shut down.</p>
    <p class="systemRelationship"><strong>System relationship</strong><br>Auxiliary Power System &rarr; Compressors &rarr; Locomotive pneumatic system</p>
  `,
  battery: `
    <h1>Battery System</h1>
    <h2>Stored energy for traction</h2>
    <p>The Battery System is the BET's energy store. Five racks hold 30 lithium iron phosphate battery packs, providing approximately 2.3 MWh of energy at up to 1,500 V DC. The packs use commercially available technology proven in light- and heavy-transport applications.</p>
    <p>When the locomotive calls for power, energy travels from the batteries through the Traction DC/DC Converters to the locomotive's existing traction system. Energy returns to the batteries through rooftop or plug-in charging, regenerative braking, or charging from the locomotive's diesel engine while idling.</p>
    <p>The Battery Management System monitors the packs, while five Thermal Management Units control the temperature of the battery racks and their associated power converters.</p>
    <h3>At a glance</h3>
    <div class="specRow"><span>Stored energy</span><span>Approximately 2.3 MWh</span></div>
    <div class="specRow"><span>System voltage</span><span>Up to 1,500 V DC</span></div>
    <div class="specRow"><span>Configuration</span><span>5 racks &middot; 30 LFP packs</span></div>
    <p class="systemRelationship"><strong>System relationship</strong><br>Charging and regeneration &rarr; Battery System &rarr; Traction DC/DC Converters</p>
  `,
  controlCabinet: `
    <h1>BET Control System</h1>
    <h2>Coordinating the BET and locomotive</h2>
    <p>The BET Control System coordinates the batteries, traction converters, charging, thermal management, auxiliary power and compressed-air equipment. It interprets locomotive demand and manages the operating state and energy flow of the BET.</p>
    <p>The BET and locomotive communicate through a dedicated, redundant data connection, with direct hard-wired connections carrying critical signals. This allows the new battery systems to work with the locomotive's existing controls without replacing them.</p>
    <p>The system reports operating mode, battery state of charge, power flow, energy source, charging status, alarms and faults to the locomotive.</p>
    <p class="systemRelationship"><strong>System relationship</strong><br>Locomotive demand &harr; BET Control System &harr; BET subsystems</p>
  `,
  cooling: `
    <h1>Thermal Management System</h1>
    <h2>Temperature control for batteries and power electronics</h2>
    <p>The BET contains five identical liquid-based Thermal Management Units. Each serves one battery rack and its associated power converter.</p>
    <p>The system removes heat produced during operation and can warm the batteries in cold conditions. This keeps the batteries and power electronics within the temperatures required for reliable operation as workload and weather change.</p>
    <p class="systemRelationship"><strong>System relationship</strong><br>Thermal Management Unit &rarr; Battery rack and associated power converter</p>
  `,
  dcac: `
    <h1>Auxiliary Power System</h1>
    <h2>Power for the BET's supporting equipment</h2>
    <p>Not all battery energy is used to move the train. The Auxiliary Power System converts energy from the batteries into the electrical power required by the BET's control, thermal-management and compressed-air systems.</p>
    <p>By powering this supporting equipment, the system allows the BET to manage itself and maintain the locomotive's pneumatic air supply while operating or charging.</p>
    <p class="systemRelationship"><strong>System relationship</strong><br>Battery System &rarr; Auxiliary Power System &rarr; Supporting equipment</p>
  `,
  dcdc: `
    <h1>Traction DC/DC Converters</h1>
    <h2>The electrical bridge between the BET and locomotive</h2>
    <p>The Traction DC/DC Converters manage the transfer of energy between the Battery System and the locomotive's existing traction equipment. Multiple units work together as power demand changes, delivering up to approximately 1.8 MW to the locomotive.</p>
    <p>The converters are bidirectional. They send battery energy towards the traction motors during acceleration and hauling, then carry recovered energy back to the batteries during regenerative braking. The same connection also carries charging energy supplied by the locomotive's diesel engine while idling.</p>
    <p>The BET Control System coordinates this flow, allowing the modern Battery System to work with a locomotive that was not originally designed for battery power.</p>
    <p class="systemRelationship"><strong>System relationship</strong><br>Battery System &harr; Traction DC/DC Converters &harr; Locomotive traction system</p>
  `,
  driversCab: `
    <h1>Driver's Cab &amp; HMI</h1>
    <h2>BET information within the existing cab</h2>
    <p>A new Human&ndash;Machine Interface gives the driver a clear view of the BET without altering the locomotive's original driving controls or obstructing visibility.</p>
    <p>The driver can view battery state of charge, the current power source and operating mode, charging status and system alerts. The display also allows approved operating modes to be selected manually.</p>
    <p class="systemRelationship"><strong>System relationship</strong><br>BET Control System &harr; Driver's HMI</p>
  `,
  body: `
    <h1>Locomotive Body</h1>
    <h2>An existing locomotive adapted for battery power</h2>
    <p>The project connects the BET to an Aurizon 2300 Class locomotive. The locomotive retains its diesel engine and full original functionality, so it can continue operating conventionally when the BET is offline or disconnected.</p>
    <p>New equipment includes control and data-processing hardware, the cab display, interfaces for BET power, control and air, and an electrically driven traction-motor cooling fan. The electric fan maintains traction-motor cooling when the diesel engine is shut down.</p>
    <p>The result is a locomotive that can use a new source of traction energy without replacing its established platform.</p>
    <p class="systemRelationship"><strong>System relationship</strong><br>BET power, control and air &harr; Existing locomotive platform</p>
  `,
  bogie: `
    <h1>Bogie &amp; Traction System</h1>
    <h2>Turning electrical energy into movement</h2>
    <p>The locomotive's existing bogies carry the wheelsets, suspension and traction equipment that transfer force to the rails. The traction motors convert electrical energy into rotation at the wheels.</p>
    <p>The BET adds a new source of electrical energy without changing the locomotive's bogies, wheelsets or traction-motor arrangement. During acceleration and hauling, battery energy helps drive the existing traction motors. During braking, those motors operate as generators and return recoverable energy to the Battery System.</p>
    <p class="systemRelationship"><strong>System relationship</strong><br>BET energy &harr; Traction motors &harr; Wheels and rails</p>
  `,
  charger: `
    <h1>Charging &amp; Energy Regeneration</h1>
    <h2>Four ways to replenish the batteries</h2>
    <p>The BET can receive or recover energy in four different ways, each suited to a different operating situation.</p>
    <div class="chargingStage" data-charging-stage="rooftop">
      <h3>1. Rooftop charging</h3>
      <p>A tower-mounted reversed pantograph lowers onto the charging rail on the BET roof. Connected to a purpose-built charging substation, it supplies energy at approximately 2 MW without requiring an operator to handle a large high-voltage cable.</p>
      <p><strong>Best suited to:</strong> high-power charging during planned operating windows.</p>
    </div>
    <div class="chargingStage" data-charging-stage="regenerative">
      <h3>2. Regenerative braking</h3>
      <p>During braking, the locomotive's traction motors operate as generators. A portion of the train's movement is converted into electrical energy and returned to the batteries instead of being lost as heat.</p>
      <p><strong>Used during:</strong> normal train operation whenever braking conditions allow energy recovery.</p>
    </div>
    <div class="chargingStage" data-charging-stage="plugin">
      <h3>3. Plug-in charging</h3>
      <p>A standard industrial connection provides slower charging at depots, workshops and other locations without rooftop infrastructure.</p>
      <p><strong>Best suited to:</strong> stationary charging where more time is available.</p>
      <h3>4. Diesel-engine idle charging</h3>
      <p>The locomotive's diesel engine can also supply charging energy while idling, providing another option when external charging infrastructure is unavailable.</p>
    </div>
    <p class="systemRelationship"><strong>System relationship</strong><br>Charging or recovered energy &rarr; Battery System</p>
  `,
};

const PANEL_PATHWAYS = {
  airCompressor: {
    label: "Air pathway",
    nodes: [
      { label: "Auxiliary power", icon: "power" },
      { label: "Compressors", icon: "compressor", active: true },
      { label: "Locomotive air system", icon: "air" },
    ],
  },
  battery: {
    label: "Energy pathway",
    nodes: [
      { label: "Charging & regeneration", icon: "charge" },
      { label: "Battery System", icon: "battery", active: true },
      { label: "Traction conversion", icon: "conversion" },
    ],
  },
  controlCabinet: {
    label: "Control pathway",
    bidirectional: true,
    nodes: [
      { label: "Locomotive demand", icon: "locomotive" },
      { label: "BET Control System", icon: "control", active: true },
      { label: "BET equipment", icon: "equipment" },
    ],
  },
  cooling: {
    label: "Thermal pathway",
    nodes: [
      { label: "Thermal management", icon: "thermal", active: true },
      { label: "Battery rack", icon: "battery" },
      { label: "Power converter", icon: "conversion" },
    ],
  },
  dcac: {
    label: "Auxiliary energy pathway",
    nodes: [
      { label: "Battery System", icon: "battery" },
      { label: "Auxiliary Power", icon: "power", active: true },
      { label: "Supporting equipment", icon: "equipment" },
    ],
  },
  dcdc: {
    label: "Traction energy pathway",
    bidirectional: true,
    nodes: [
      { label: "Battery System", icon: "battery" },
      { label: "DC/DC Converters", icon: "conversion", active: true },
      { label: "Traction system", icon: "traction" },
    ],
  },
  driversCab: {
    label: "Driver information pathway",
    bidirectional: true,
    nodes: [
      { label: "BET Control System", icon: "control" },
      { label: "Driver's HMI", icon: "display", active: true },
    ],
  },
  body: {
    label: "Vehicle integration",
    bidirectional: true,
    nodes: [
      { label: "BET interfaces", icon: "connection" },
      { label: "Locomotive platform", icon: "locomotive", active: true },
    ],
  },
  bogie: {
    label: "Traction pathway",
    bidirectional: true,
    nodes: [
      { label: "BET energy", icon: "battery" },
      { label: "Traction motors", icon: "traction" },
      { label: "Wheels & rails", icon: "wheel", active: true },
    ],
  },
  charger: {
    label: "Charging pathway",
    nodes: [
      { label: "Energy input or recovery", icon: "charge", active: true },
      { label: "Battery System", icon: "battery" },
    ],
  },
};

const PATHWAY_ICONS = {
  air: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h10a3 3 0 1 0-3-3M4 12h14a3 3 0 1 1-3 3M4 16h5"/></svg>`,
  battery: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="17" height="12" rx="2"/><path d="M20 10h2v4h-2M7 9v6M11 9v6M15 9v6"/></svg>`,
  charge: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m13 2-7 11h6l-1 9 7-12h-6z"/></svg>`,
  compressor: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2"/><path d="M12 10c-1.2-2.7-.7-5.4 1.1-6.4 1.7-1 3.7.2 3.8 2.2.1 1.8-1.5 3.5-3.5 5M13.7 13c2.9.3 5 2 5 4.1 0 2-2 3.1-3.7 2.1-1.6-.9-2.2-3.1-1.8-5.2M10.3 13c-1.7 2.4-4.3 3.3-6 2.2-1.7-1.1-1.6-3.4.1-4.4 1.6-.9 3.7-.3 5.3 1.1"/><circle cx="12" cy="12" r="8.5"/></svg>`,
  connection: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 12h8M9 8l-4 4 4 4M15 8l4 4-4 4"/></svg>`,
  control: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 15h10M9 7v4M15 13v4"/></svg>`,
  conversion: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h13M14 5l3 3-3 3M20 16H7M10 13l-3 3 3 3"/></svg>`,
  display: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 22h8M12 18v4M7 13l3-3 2 2 4-4"/></svg>`,
  equipment: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z"/><circle cx="12" cy="12" r="3"/></svg>`,
  locomotive: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h11l3 5v8H5zM5 10h14M8 7h4M8 20l2-3M16 20l-2-3"/><circle cx="8" cy="17" r="2"/><circle cx="16" cy="17" r="2"/></svg>`,
  power: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 2v5M15 2v5M7 7h10v3a5 5 0 0 1-10 0zM12 15v7"/></svg>`,
  thermal: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14.8V5a2 2 0 0 1 4 0v9.8a4 4 0 1 1-4 0zM12 9v8"/></svg>`,
  traction: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 5v5M19 12h-5M12 19v-5M5 12h5"/></svg>`,
  wheel: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="11" r="7"/><circle cx="12" cy="11" r="2"/><path d="M12 4v5M19 11h-5M12 18v-5M5 11h5M3 21h18"/></svg>`,
};

const INSPECTABLE_PANEL_COMPONENTS = new Set([
  "airCompressor",
  "battery",
  "controlCabinet",
  "cooling",
  "dcac",
  "dcdc",
]);

const REQUIRED_INSPECTION_SCROLL_PX = 640;
const INSPECTION_WHEEL_STEP_PX = 120;

function buildPathway(config) {
  const pathway = document.createElement("section");
  pathway.className = "systemPathway";
  pathway.setAttribute("aria-label", config.label);

  const heading = document.createElement("h3");
  heading.className = "systemPathwayLabel";
  heading.textContent = config.label;

  const track = document.createElement("div");
  track.className = "systemPathwayTrack";

  config.nodes.forEach((node, index) => {
    const card = document.createElement("div");
    card.className = `systemPathwayNode${node.active ? " is-active" : ""}`;
    card.innerHTML = `
      <span class="systemPathwayIcon">${PATHWAY_ICONS[node.icon] || PATHWAY_ICONS.equipment}</span>
      <span class="systemPathwayName">${node.label}</span>
    `;
    track.appendChild(card);

    if (index < config.nodes.length - 1) {
      const connector = document.createElement("span");
      connector.className = `systemPathwayConnector${config.bidirectional ? " is-bidirectional" : ""}`;
      connector.setAttribute("aria-hidden", "true");
      connector.innerHTML = `<span class="systemPathwayPulse"></span>`;
      track.appendChild(connector);
    }
  });

  pathway.append(heading, track);
  return pathway;
}

function installFinalPanelContent() {
  Object.entries(FINAL_PANEL_CONTENT).forEach(([component, content]) => {
    const panel = document.getElementById(`${component}Panel`);
    if (!panel) return;
    panel.innerHTML = content;
    const relationship = panel.querySelector(".systemRelationship");
    if (relationship && PANEL_PATHWAYS[component]) {
      relationship.replaceWith(buildPathway(PANEL_PATHWAYS[component]));
    }
    if (INSPECTABLE_PANEL_COMPONENTS.has(component)) {
      const runway = document.createElement("div");
      runway.className = "inspectionScrollRunway";
      runway.setAttribute("aria-hidden", "true");
      panel.appendChild(runway);
    }
    panel.dataset.placeholderExpanded = "true";
  });
}

installFinalPanelContent();

const PLACEHOLDER_SECTIONS = [
  {
    heading: "System Overview",
    paragraphs: [
      "This placeholder section introduces the component's purpose within the wider vehicle architecture. Final copy can explain the engineering role, key customer benefits and the relationship between this equipment and adjacent systems.",
      "The information is intentionally extended for interaction testing. It provides enough reading depth to evaluate panel scrolling, inspection progress, component presentation and the transition into automatic rotation mode.",
    ],
  },
  {
    heading: "Design and Architecture",
    paragraphs: [
      "The production description can outline the component's physical construction, principal subassemblies, mounting strategy and electrical or mechanical interfaces. Diagrams and approved technical illustrations may be introduced here later.",
      "A modular design supports repeatable manufacturing, straightforward integration and practical servicing. This placeholder copy represents the level of detail expected in the finished interactive product experience.",
    ],
  },
  {
    heading: "Operating Principle",
    paragraphs: [
      "During normal operation, the component responds to commands from the vehicle control architecture while remaining within defined operating limits. Future content can describe the complete operating sequence in clear, non-technical language.",
      "Status information is communicated to related control and monitoring systems. Where appropriate, this section may later include animated power flow, operating states or a simplified process diagram.",
    ],
  },
  {
    heading: "Monitoring and Protection",
    paragraphs: [
      "Integrated monitoring helps the system identify abnormal operating conditions and respond predictably. The final specification will identify relevant measurements, alarms, interlocks and protective actions for this component.",
      "Diagnostic information can support both operators and maintenance personnel. This viewer may eventually expose live-style status examples or maintenance animations without changing the core panel structure.",
    ],
  },
  {
    heading: "Inspection and Maintenance",
    paragraphs: [
      "Routine inspection may include checking mounting hardware, connectors, hoses, cable routing, cleanliness and visible condition. Approved service procedures and isolation requirements will replace this placeholder guidance.",
      "Future versions can provide downloadable documents, maintenance intervals and component-specific service animations. For now, this final section ensures the full scrolling and reverse-inspection experience can be tested.",
    ],
  },
];

function addPlaceholderContent() {
  document.querySelectorAll(".componentPanel").forEach((panel) => {
    if (
      panel.id === "batteryPanel" ||
      panel.id === "chargerPanel" ||
      panel.dataset.placeholderExpanded
    ) return;

    const componentName = panel.querySelector("h1")?.textContent?.trim() || "Component";

    PLACEHOLDER_SECTIONS.forEach((section, sectionIndex) => {
      const heading = document.createElement("h3");
      heading.textContent = section.heading;
      panel.appendChild(heading);

      section.paragraphs.forEach((copy) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = `${componentName}: ${copy}`;
        panel.appendChild(paragraph);
      });

      ["Configuration", "Operating range", "Monitoring", "Service interval"]
        .forEach((label) => {
          const row = document.createElement("div");
          row.className = "specRow";

          const name = document.createElement("span");
          name.textContent = label;

          const value = document.createElement("span");
          value.textContent = `Placeholder ${sectionIndex + 1}`;

          row.append(name, value);
          panel.appendChild(row);
        });
    });

    panel.dataset.placeholderExpanded = "true";
  });
}

addPlaceholderContent();

let lastChargingStage = null;
let navigationUnlockTimer = null;
let inspectionWheelTarget = null;
let inspectionWheelAnimationFrame = null;
let inspectionWheelLastFrameAt = null;

function resetInspectionWheelAnimation() {
  if (inspectionWheelAnimationFrame !== null) {
    window.cancelAnimationFrame(inspectionWheelAnimationFrame);
  }
  inspectionWheelTarget = null;
  inspectionWheelAnimationFrame = null;
  inspectionWheelLastFrameAt = null;
}

function animateInspectionWheelScroll(panelScrollContent, now) {
  if (inspectionWheelTarget === null) {
    resetInspectionWheelAnimation();
    return;
  }

  const elapsed = inspectionWheelLastFrameAt === null
    ? 16
    : Math.min(50, now - inspectionWheelLastFrameAt);
  inspectionWheelLastFrameAt = now;

  const remaining = inspectionWheelTarget - panelScrollContent.scrollTop;
  const easingAmount = 1 - Math.exp(-elapsed / 75);

  if (Math.abs(remaining) <= 0.5) {
    panelScrollContent.scrollTop = inspectionWheelTarget;
    resetInspectionWheelAnimation();
    return;
  }

  panelScrollContent.scrollTop += remaining * easingAmount;
  inspectionWheelAnimationFrame = window.requestAnimationFrame((nextNow) => {
    animateInspectionWheelScroll(panelScrollContent, nextNow);
  });
}

function addInspectionWheelStep(panelScrollContent, amount) {
  const maximumScroll = Math.max(
    0,
    panelScrollContent.scrollHeight - panelScrollContent.clientHeight
  );

  if (inspectionWheelTarget === null) {
    inspectionWheelTarget = panelScrollContent.scrollTop;
  }

  inspectionWheelTarget = Math.max(
    0,
    Math.min(maximumScroll, inspectionWheelTarget + amount)
  );

  if (inspectionWheelAnimationFrame === null) {
    inspectionWheelLastFrameAt = null;
    inspectionWheelAnimationFrame = window.requestAnimationFrame((now) => {
      animateInspectionWheelScroll(panelScrollContent, now);
    });
  }
}

function dispatchChargingStage(infoPanel, force = false) {
  const stages = Array.from(
    document.querySelectorAll("#chargerPanel.active [data-charging-stage]")
  );
  if (!stages.length) return;

  const panelBounds = infoPanel.getBoundingClientRect();
  const readingLine = panelBounds.top + infoPanel.clientHeight * 0.35;
  let activeStage = stages[0].dataset.chargingStage;

  stages.forEach((stage) => {
    if (stage.getBoundingClientRect().top <= readingLine) {
      activeStage = stage.dataset.chargingStage;
    }
  });

  if (!force && activeStage === lastChargingStage) return;
  lastChargingStage = activeStage;
  document.dispatchEvent(new CustomEvent("chargingStageChanged", {
    detail: { stage: activeStage },
  }));
}

function prepareInspectionScrollRange(component, panelScrollContent) {
  document.querySelectorAll(".inspectionScrollRunway").forEach((runway) => {
    runway.style.height = "0px";
  });

  if (
    !INSPECTABLE_PANEL_COMPONENTS.has(component) ||
    window.matchMedia("(max-width: 768px), (pointer: coarse)").matches
  ) return;

  const runway = document.querySelector(
    `#${component}Panel .inspectionScrollRunway`
  );
  if (!runway) return;

  const availableScroll = Math.max(
    0,
    panelScrollContent.scrollHeight - panelScrollContent.clientHeight
  );
  const missingScroll = Math.max(
    0,
    REQUIRED_INSPECTION_SCROLL_PX - availableScroll
  );

  runway.style.height = `${missingScroll}px`;
}

export function openPanel(component) {
  document.querySelectorAll(".componentPanel").forEach((panel) => {
    panel.classList.remove("active");
  });

  const activePanel = document.getElementById(component + "Panel");
  activePanel.classList.add("active");

  const infoPanel = document.getElementById("infoPanel");
  const panelScrollContent = document.getElementById("panelScrollContent");
  resetInspectionWheelAnimation();
  panelScrollContent.scrollTop = 0;
  infoPanel.classList.add("open");
  infoPanel.focus({ preventScroll: true });
  document.getElementById("panelNavigation").hidden = component === "charger";
  prepareInspectionScrollRange(component, panelScrollContent);

  if (component === "charger") {
    dispatchChargingStage(panelScrollContent, true);
  }
}

export function closePanel() {
  document.getElementById("infoPanel").classList.remove("open");
}

//Event Listeners
document.getElementById("closePanelButton").addEventListener("click", () => {
  document.dispatchEvent(new CustomEvent("panelClosed"));
});

document.getElementById("previousComponentButton").addEventListener("click", () => {
  document.dispatchEvent(new CustomEvent("componentNavigationRequested", {
    detail: { direction: -1 },
  }));
});

document.getElementById("nextComponentButton").addEventListener("click", () => {
  document.dispatchEvent(new CustomEvent("componentNavigationRequested", {
    detail: { direction: 1 },
  }));
});

document.addEventListener("componentNavigationPositionChanged", (event) => {
  document.getElementById("componentPosition").textContent =
    `${event.detail.position} of ${event.detail.total}`;
});

document.addEventListener("componentNavigationLockChanged", (event) => {
  const buttons = [
    document.getElementById("previousComponentButton"),
    document.getElementById("nextComponentButton"),
  ];

  window.clearTimeout(navigationUnlockTimer);
  buttons.forEach((button) => {
    button.disabled = event.detail.locked;
  });

  if (event.detail.locked) {
    navigationUnlockTimer = window.setTimeout(() => {
      buttons.forEach((button) => {
        button.disabled = false;
      });
    }, event.detail.durationMs);
  }
});

document.getElementById("infoPanel").addEventListener("click", (event) => {
  event.stopPropagation();
});

document.getElementById("panelScrollContent").addEventListener("scroll", (event) => {
  dispatchChargingStage(event.currentTarget);
  document.dispatchEvent(new CustomEvent("inspectionScrollChanged", {
    detail: { scrollTop: event.currentTarget.scrollTop },
  }));
}, { passive: true });

// While a panel is open, treat wheel/trackpad input anywhere in the viewer as
// panel navigation. This keeps the reading and inspection interaction working
// even when the pointer is over the Three.js canvas.
document.addEventListener("wheel", (event) => {
  const infoPanel = document.getElementById("infoPanel");
  if (!infoPanel.classList.contains("open") || event.ctrlKey) return;
  const panelScrollContent = document.getElementById("panelScrollContent");
  const activePanel = document.querySelector(".componentPanel.active");
  const usesInspectionWheelSteps = Boolean(
    activePanel?.querySelector(".inspectionScrollRunway")
  ) && !window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;

  event.preventDefault();

  const isDiscreteInspectionWheel = usesInspectionWheelSteps && (
    event.deltaMode === WheelEvent.DOM_DELTA_LINE ||
    (event.deltaMode === WheelEvent.DOM_DELTA_PIXEL && Math.abs(event.deltaY) >= 40)
  );

  if (isDiscreteInspectionWheel) {
    addInspectionWheelStep(
      panelScrollContent,
      Math.sign(event.deltaY) * INSPECTION_WHEEL_STEP_PX
    );
    return;
  }

  // Trackpads and scrollbar input remain directly coupled to the panel so
  // their existing continuous inspection response is unchanged.
  resetInspectionWheelAnimation();

  let scrollAmount = event.deltaY;
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    scrollAmount = event.deltaY * 18;
  } else if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    scrollAmount *= panelScrollContent.clientHeight;
  }

  panelScrollContent.scrollTop += scrollAmount;
}, { capture: true, passive: false });
