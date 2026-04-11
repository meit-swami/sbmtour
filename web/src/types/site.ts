export type MenuNode = {
  id: number;
  title: string;
  href: string;
  target: string;
  children: MenuNode[];
};

export type MenuResponse = {
  data: {
    source: string;
    items: MenuNode[];
  };
};

export type FooterWidget = {
  id: number;
  widget_type: string;
  widget_title: string | null;
  widget_content: string | null;
  widget_url: string | null;
  widget_iframe: string | null;
  column_position: number;
  row_order: number;
};

export type FooterResponse = {
  data: {
    mode: "dynamic" | "default";
    widgets?: FooterWidget[];
    fallback: Record<string, unknown>;
  };
};
