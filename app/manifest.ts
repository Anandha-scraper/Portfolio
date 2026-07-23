import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Anandha Kumaran M S — The Living Blueprint",
    short_name: "Anandha Kumaran",
    description:
      "The Living Blueprint — an interactive developer portfolio. Scalable web apps, CRM systems, and Web3 experiences.",
    start_url: "/",
    display: "standalone",
    background_color: "#14110c",
    theme_color: "#14110c",
    icons: [
      {
        src: "/icon.png",
        sizes: "256x256",
        type: "image/png",
      },
    ],
  };
}
