import { BrandMark } from "./BrandMark";
import LogoutButton from "./logout-button";

export function AppHeader() {
  return (
    <header className="app-header">
      <div className="brand-container app-header-inner">
        <BrandMark showTagline={false} />

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}