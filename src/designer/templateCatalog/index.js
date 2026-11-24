import { premiumPalettes } from "./palettes.js";

const collections = [
  ["Royal Distinction", "royal", "OF EXCELLENCE", "In recognition of exceptional achievement and dedication"],
  ["Academic Laureate", "academic", "OF ACADEMIC MERIT", "For outstanding academic performance and commitment"],
  ["Corporate Prestige", "corporate", "OF RECOGNITION", "In recognition of professional excellence and contribution"],
  ["Heritage Honour", "heritage", "OF ACHIEVEMENT", "For remarkable achievement and distinguished service"],
  ["Editorial Excellence", "minimal", "OF COMPLETION", "For successfully completing the programme"],
  ["Imperial Distinction", "midnight", "OF HONOUR", "In recognition of outstanding merit and dedication"],
  ["Botanical Appreciation", "botanical", "OF APPRECIATION", "With sincere appreciation for your valuable contribution"],
  ["Innovation Award", "technology", "OF INNOVATION", "For demonstrating creativity and technical excellence"],
  ["Creative Achievement", "artistic", "OF PARTICIPATION", "For enthusiastic participation and creative contribution"],
  ["Classic Merit", "classic", "OF MERIT", "For demonstrating commitment, skill and excellence"]
];

export const premiumCertificateCatalog = collections.flatMap(
  ([name, style, subtitle, description], index) =>
    premiumPalettes.map((palette, colourIndex) => ({
      id: `premium-${index + 1}-${colourIndex + 1}`,
      name: `${name} - ${palette.name}`,
      category: "Certificates",
      premium: true,
      style,
      subtitle,
      description,
      palette,
      bg: palette.background,
      border: palette.accent,
      accent: palette.primary,
      title: "CERTIFICATE"
    }))
);
