export function openPanel(component) {
  document.querySelectorAll(".componentPanel").forEach((panel) => {
    panel.classList.remove("active");
  });

  document
    document.getElementById(component + "Panel")
    .classList.add("active");

  document.getElementById("infoPanel").classList.add("open");
}

export function closePanel() {
  document.getElementById("infoPanel").classList.remove("open");
}

//Event Listeners
document.getElementById("closePanelButton").addEventListener("click", () => {
  document.dispatchEvent(new CustomEvent("panelClosed"));
});
