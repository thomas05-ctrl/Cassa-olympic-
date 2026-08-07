export type UnitType = "parish" | "deanery" | "club" | "zone";

export interface UnitLabels {
  type: UnitType;
  singular: string;
  plural: string;
  singularLower: string;
  pluralLower: string;
  crest: string;
  icon: string;
}

export function getUnitLabels(unitLabel?: UnitType): UnitLabels {
  const type = unitLabel || "parish";
  switch (type) {
    case "deanery":
      return {
        type: "deanery",
        singular: "Deanery",
        plural: "Deaneries",
        singularLower: "deanery",
        pluralLower: "deaneries",
        crest: "Deanery Crest / Shield",
        icon: "🏛️"
      };
    case "club":
      return {
        type: "club",
        singular: "Club",
        plural: "Clubs",
        singularLower: "club",
        pluralLower: "clubs",
        crest: "Club Badge / Crest",
        icon: "🛡️"
      };
    case "zone":
      return {
        type: "zone",
        singular: "Zone",
        plural: "Zones",
        singularLower: "zone",
        pluralLower: "zones",
        crest: "Zone Crest / Emblem",
        icon: "📍"
      };
    case "parish":
    default:
      return {
        type: "parish",
        singular: "Parish",
        plural: "Parishes",
        singularLower: "parish",
        pluralLower: "parishes",
        crest: "Parish Crest / Logo",
        icon: "🏰"
      };
  }
}
