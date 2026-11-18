"use client";
import { Icon } from "@/components/ui/icon";
import { useWorkspace } from "@/features/workspace/workspace-provider";

export function FarmSelect() {
  const { farms, farmId, setFarmId } = useWorkspace();
  return (
    <label className="farm-select">
      <Icon name="farm" />
      <select
        aria-label="Pilih lahan"
        value={farmId}
        onChange={(event) => setFarmId(event.target.value)}
      >
        {farms.length === 0 && <option value="">Belum ada lahan</option>}
        {farms.map((farm) => (
          <option key={farm.id} value={farm.id}>
            {farm.name}
          </option>
        ))}
      </select>
    </label>
  );
}
