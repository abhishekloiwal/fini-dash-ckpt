export interface Bot {
  id: string;
  name: string;
  status: "active" | "inactive";
  deployments: number;
}

export const bots: Bot[] = [
  {
    id: "1",
    name: "Mariposa",
    status: "active",
    deployments: 0,
  },
  {
    id: "2",
    name: "DO NOT USE - Zendesk",
    status: "active",
    deployments: 0,
  },
  {
    id: "3",
    name: "DO NOT USE - test",
    status: "active",
    deployments: 0,
  },
];
