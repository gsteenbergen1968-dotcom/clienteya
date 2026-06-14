import { BrandMark } from "./BrandMark";
import LogoutButton from "./logout-button";

export function AppHeader() {
  return (
    <header className="app-header">
      <div className="brand-container app-header-inner flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0 flex-1 overflow-hidden">
          <BrandMark showTagline={false} />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}