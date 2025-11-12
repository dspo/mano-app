import { ComponentType } from "react";

export type NodeType = "Directory" | "RichText" | "PlainText" | "Markdown";

export const Directory: NodeType = "Directory";
export const RichText: NodeType = "RichText";
export const PlainText: NodeType = "PlainText";
export const Markdown: NodeType = "Markdown";

export type GmailItem = {
    id: string;
    name: string;
    icon: ComponentType;
    unread?: number;
    moreInfo?: string[];
    readOnly: boolean;
    nodeType?: NodeType;
    children?: GmailItem[];
};

// 工作目录路径
export const workspaceDir = "/Users/chenzhongrun/projects/dspo-rs/mano";