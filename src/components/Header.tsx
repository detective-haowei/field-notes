import { useStore } from "../store/StoreContext";
import { DataMenu } from "./DataMenu";
import { Logo } from "./Logo";
import { SearchBox } from "./SearchBox";

export function Header({ onManage }: { onManage: () => void }) {
  const { status } = useStore();
  return (
    <header>
      <h1>
        <Logo />
        <span>Field Notes</span>
      </h1>
      <SearchBox />
      <div className="hact">
        <span className="status" role="status">
          {status}
        </span>
        <DataMenu onManage={onManage} />
      </div>
    </header>
  );
}
