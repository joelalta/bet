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

function pinPanelNavigation(infoPanel) {
  const navigation = document.getElementById("panelNavigation");
  if (navigation.hidden) return;

  if (window.matchMedia("(max-width: 768px), (pointer: coarse)").matches) {
    navigation.style.removeProperty("top");
    return;
  }

  navigation.style.top = `${
    infoPanel.scrollTop +
    infoPanel.clientHeight -
    navigation.offsetHeight -
    24
  }px`;
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

export function openPanel(component) {
  document.querySelectorAll(".componentPanel").forEach((panel) => {
    panel.classList.remove("active");
  });

  const activePanel = document.getElementById(component + "Panel");
  activePanel.classList.add("active");

  const infoPanel = document.getElementById("infoPanel");
  infoPanel.scrollTop = 0;
  infoPanel.classList.add("open");
  infoPanel.focus({ preventScroll: true });
  document.getElementById("panelNavigation").hidden = component === "charger";
  pinPanelNavigation(infoPanel);

  if (component === "charger") {
    dispatchChargingStage(infoPanel, true);
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

document.getElementById("infoPanel").addEventListener("scroll", (event) => {
  pinPanelNavigation(event.currentTarget);
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

  event.preventDefault();

  let scrollAmount = event.deltaY;
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    scrollAmount *= 18;
  } else if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    scrollAmount *= infoPanel.clientHeight;
  }

  infoPanel.scrollTop += scrollAmount;
}, { capture: true, passive: false });

window.addEventListener("resize", () => {
  const infoPanel = document.getElementById("infoPanel");
  if (infoPanel.classList.contains("open")) pinPanelNavigation(infoPanel);
});
