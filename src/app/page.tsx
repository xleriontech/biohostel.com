import Site from "./site";
import { defaultStayRange } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const { checkIn, checkOut } = defaultStayRange();
  return <Site defaultCheckIn={checkIn} defaultCheckOut={checkOut} />;
}
