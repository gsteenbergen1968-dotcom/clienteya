import MobileActionBar from "../components/MobileActionBar";
import MobileTopBar from "../components/MobileTopBar";

export const metadata = {
  title: "ClienteYA Dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MobileTopBar />
      <div className="pb-20 lg:pb-0">{children}</div>
      <MobileActionBar />
    </>
  );
}