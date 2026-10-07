import type { Project } from "@/types";

/**
 * Project entries for the dungeon ecosystem. Screenshots live under
 * public/projects/<id>/ and are listed in each entry's `previewImages`.
 *
 * Maintained via the dev-only /master console (npm run master) — edits are
 * serialized by scripts/master-serializers.mjs.
 */
export const projects: Project[] = [
  {
    "id": "syntax",
    "name": "Syntax",
    "tagline": "Role-based coding contests & quizzes",
    "category": "platform",
    "status": "shipped",
    "year": "2024",
    "overview": "A role-based coding contest and quiz platform enabling secure assessments, educational content management, and competitive learning experiences for academic communities.",
    "highlights": [
      "Secure, role-based assessment engine",
      "Educational content management",
      "Competitive learning & quiz experiences"
    ],
    "stack": [
      "JavaScript",
      "React",
      "Node.js",
      "Express",
      "MongoDB"
    ],
    "metrics": [
      {
        "label": "Assessment modes",
        "value": 2,
        "suffix": "+"
      }
    ],
    "accent": "violet",
    "links": {
      "github": "https://github.com/Anandha-scraper/Syntax"
    },
    "related": [
      "spot",
      "crm3i"
    ],
    "featured": false,
    "previewImages": [
      "/projects/syntax/syntax1.webp",
      "/projects/syntax/syntax2.webp"
    ]
  },
  {
    "id": "spot",
    "name": "SPOT — Sakthi Auto",
    "tagline": "Real-time industrial QA, paperless",
    "category": "enterprise",
    "status": "internal",
    "year": "2024",
    "overview": "Digitized industrial QA workflows for an automotive manufacturer under a strict NDA — replacing manual paper reporting with a responsive inspection interface and instant data synchronization through scalable APIs.",
    "highlights": [
      "Replaced manual QA reporting with a realtime interface",
      "Instant data sync via scalable REST APIs",
      "Built under NDA for a production industrial environment"
    ],
    "stack": [
      "JavaScript",
      "React",
      "Node.js",
      "REST APIs"
    ],
    "metrics": [
      {
        "label": "Reporting",
        "value": 100,
        "prefix": "",
        "suffix": "% digital"
      }
    ],
    "accent": "blue",
    "links": {
      "github": "https://github.com/Anandha-scraper/SPOT-Q"
    },
    "related": [
      "magizh",
      "crm3i"
    ],
    "featured": false,
    "previewImages": [
      "/projects/spot/sakthiauto1.webp",
      "/projects/spot/sakthiauto2.webp"
    ]
  },
  {
    "id": "magizh",
    "name": "Magizh Industries",
    "tagline": "Enterprise employee management + onboarding",
    "category": "enterprise",
    "status": "shipped",
    "year": "2023",
    "overview": "A responsive enterprise platform featuring OTP authentication and full CRUD operations with comprehensive log tracking for employee management and secure, email-based onboarding.",
    "highlights": [
      "OTP-based authentication",
      "Full CRUD with comprehensive activity log tracking",
      "Secure email-based employee onboarding"
    ],
    "stack": [
      "JavaScript",
      "React",
      "Node.js",
      "Express",
      "MongoDB"
    ],
    "metrics": [
      {
        "label": "Auth",
        "value": 1,
        "prefix": "OTP +",
        "suffix": " email"
      }
    ],
    "accent": "emerald",
    "links": {
      "github": "https://github.com/Anandha-scraper/Magizh-Industries"
    },
    "related": [
      "spot",
      "crm3i"
    ],
    "featured": false,
    "previewImages": [
      "/projects/magizh/magizhindustries.webp"
    ]
  },
  {
    "id": "crm3i",
    "name": "3i Services CRM",
    "tagline": "Cost-aware internal CRM & ledger automation",
    "category": "enterprise",
    "status": "internal",
    "year": "2023",
    "overview": "An enterprise-grade internal CRM that automates financial ledger tracking and streamlines follow-up scheduling — with robust data pipelines and query optimization deliberately engineered to minimize operational cloud costs.",
    "highlights": [
      "Automated financial ledger tracking",
      "Follow-up scheduling workflows",
      "Query optimization to strictly minimize cloud costs"
    ],
    "stack": [
      "JavaScript",
      "React",
      "Node.js",
      "Express",
      "Database"
    ],
    "metrics": [
      {
        "label": "Focus",
        "value": 1,
        "prefix": "Cost",
        "suffix": "-optimized"
      }
    ],
    "accent": "indigo",
    "links": {
      "github": "https://github.com/Anandha-scraper/3I-Services"
    },
    "related": [
      "spot",
      "magizh"
    ],
    "featured": false,
    "previewImages": [
      "/projects/crm3i/3iservices1.webp",
      "/projects/crm3i/3iservices2.webp",
      "/projects/crm3i/3iservices3.webp",
      "/projects/crm3i/3iservices4.webp"
    ]
  }
];

export const featuredProjects = projects.filter((p) => p.featured);
