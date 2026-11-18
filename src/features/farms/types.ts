import type { Farm, Zone } from "@/features/demo/types";
export type FarmEditor =
  | {
      type: "farm";
      farm?: Farm;
    }
  | {
      type: "zone";
      farmId: string;
      zone?: Zone;
    }
  | {
      type: "delete-farm";
      farm: Farm;
    }
  | {
      type: "delete-zone";
      zone: Zone;
    }
  | {
      type: "device";
      zone: Zone;
    }
  | null;
