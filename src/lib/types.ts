export type Category = "Social" | "Shopping" | "Entertainment" | "Productivity" | "Other";

export type Account = {
  id: string;
  name: string;
  domain: string;
  category: Category;
  color: string;
  letter: string;
  sources: ("mailbox" | "breach" | "import")[];
  evidence: string;
  exposure?: { title: string; date: string; dataClasses: string[] };
};

export type SourceStatus = {
  id: "mailbox" | "breach";
  name: string;
  status: "complete" | "not-connected" | "unavailable" | "error";
  message: string;
};

export type DiscoveryResult = {
  accounts: Account[];
  sources: SourceStatus[];
  scannedAt: string;
};
