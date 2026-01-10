import Navbar from "@/components/Navbar.jsx";
import Drawer from "@/components/Drawer.jsx";
import ProblemList from "@/components/ProblemList.jsx";

export default function ProblemPage() {
  return (
    <>
      <Navbar/>
      <div className="flex">
      <Drawer/>
      <ProblemList/>
      </div>
    </>
  );
}

