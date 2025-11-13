import { ElementType } from "react";

export type NodeType = "Directory" | "RichText" | "PlainText" | "Markdown";

export const Directory: NodeType = "Directory";
export const RichText: NodeType = "RichText";
export const PlainText: NodeType = "PlainText";
export const Markdown: NodeType = "Markdown";

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
