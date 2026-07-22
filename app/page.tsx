import dynamic from "next/dynamic";
import { Navigation } from "@/components/navigation/navigation";
import { MissionControl } from "@/components/mission-control/mission-control";
import { ProjectEcosystem } from "@/components/project-ecosystem/project-ecosystem";

// Below-the-fold sections are code-split to keep the initial bundle lean.
const CapabilityNetwork = dynamic(() =>
  import("@/components/capability-network/capability-network").then(
    (m) => m.CapabilityNetwork
  )
);
const ContactStudio = dynamic(() =>
  import("@/components/contact/contact-studio").then((m) => m.ContactStudio)
);

export default function Home() {
  return (
    <>
      <Navigation />
      <main className="home-main">
        <MissionControl />
        <ProjectEcosystem />
        <CapabilityNetwork />
        <ContactStudio />
      </main>
    </>
  );
}
