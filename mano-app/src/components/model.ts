import { ElementType } from "react";

export type NodeType = "Directory" | "PlainText" | "Markdown" | "LexicalText";

export const Directory: NodeType = "Directory";
export const PlainText: NodeType = "PlainText";
export const Markdown: NodeType = "Markdown";

export const LexicalText: NodeType = "LexicalText";

export type GmailItem = {
    id: string;
    name: string;
    icon: ElementType;
    unread?: number;
    moreInfo?: string[];
    readOnly: boolean;
    nodeType?: NodeType;
    children?: GmailItem[];
};

