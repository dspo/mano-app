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

// GmailItem 的 filename 方法实现
export const getGmailItemFilename = (item: GmailItem): string => {
    const safeName = item.name.replace(/[^a-zA-Z0-9一-龥]/g, '_');
    return `${safeName}.rtf`;
};
