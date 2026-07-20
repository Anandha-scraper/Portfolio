import Image from "next/image";
import { ACCENTS } from "@/lib/accents";
import { Carousel } from "@/components/ui/carousel";
import type { Project } from "@/types";

/**
 * ProjectPreviewPanel — the screenshot pane of ProjectDungeonPanel. A single
 * screenshot carousel for the project — optional on Project (types/index.ts);
 * falls back to the shared demo image until real per-project assets are
 * dropped under public/projects/<id>/.
 */

const DEFAULT_IMAGE = "/projects/image.png";

function DefaultFrame({ alt }: { alt: string }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-sm border border-ops-line">
      <Image src={DEFAULT_IMAGE} alt={alt} fill className="object-cover" unoptimized />
    </div>
  );
}

export function ProjectPreviewPanel({ project }: { project: Project }) {
  const accent = ACCENTS[project.accent];

  return (
    <div className="w-full sm:mx-auto sm:max-w-md lg:mx-0 lg:w-[380px] lg:max-w-none lg:shrink-0">
      {project.previewImages?.length ? (
        <Carousel
          items={project.previewImages.map((src, i) => ({
            id: i,
            src,
            alt: `${project.name} screenshot ${i + 1}`,
          }))}
          accentHex={accent.hex}
          loop
          pauseOnHover
        />
      ) : (
        <DefaultFrame alt={`${project.name} preview`} />
      )}
    </div>
  );
}
