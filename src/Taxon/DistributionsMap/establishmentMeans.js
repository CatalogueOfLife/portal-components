// Colours of the establishment means, shared by the distribution maps here and
// in the ChecklistBank UI.
export const ESTABLISHMENT_MEANS = [
  { key: "nativeendemic", label: "Native endemic", color: "#0F8554" },
  { key: "native", label: "Native", color: "#87C55F" },
  { key: "nativereintroduced", label: "Native reintroduced", color: "#C9DB74" },
  { key: "introduced", label: "Introduced", color: "#FE88B1" },
  {
    key: "introducedassistedcolonisation",
    label: "Introduced assisted colonisation",
    color: "#DCB0F2",
  },
  { key: "vagrant", label: "Vagrant", color: "#F6CF71" },
  { key: "uncertain", label: "Uncertain", color: "#8BE0A4" },
];

const COLORS = Object.fromEntries(ESTABLISHMENT_MEANS.map((m) => [m.key, m.color]));

// No establishment means given.
export const MISSING_COLOR = "#66C5CC";

// The key of an establishment means value: null when there is none, uncertain
// for a value outside the vocabulary.
export const meansKey = (value) => {
  if (value == null || value === "") return null;
  const k = String(value)
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  return COLORS[k] ? k : "uncertain";
};

export const meansColor = (value) => {
  const k = meansKey(value);
  return k == null ? MISSING_COLOR : COLORS[k];
};
