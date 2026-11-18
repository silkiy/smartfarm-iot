import { Icon } from "@/components/ui/icon";

export function Brand() {
  return (
    <span className="brand">
      <span className="brand-symbol">
        <Icon name="leaf" size={25} />
      </span>
      <span>
        SmartFarm<span className="brand-iot">IoT</span>
      </span>
    </span>
  );
}
