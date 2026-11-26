import { Segmented, Tooltip } from "antd";
import { EEZ, LAND } from "./areaShapes";

const OPTIONS = [
  { label: "Land", value: LAND },
  {
    label: (
      <Tooltip title="Countries with their exclusive economic zone, as GBIF uses them">
        Land + EEZ
      </Tooltip>
    ),
    value: EEZ,
  },
];

// Switches the shapes of iso countries between the land and the land with the
// exclusive economic zone.
const AreaVariantSwitch = ({ value, onChange, style }) => (
  <Segmented
    size="small"
    options={OPTIONS}
    value={value}
    onChange={onChange}
    style={style}
  />
);

export default AreaVariantSwitch;
