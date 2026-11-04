import type { ReactNode } from "react";
import SearchProvider from "../components/search/SearchProvider";

export default function Root({ children }: { children: ReactNode }) {
  return <SearchProvider>{children}</SearchProvider>;
}
