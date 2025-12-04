/**
 * Mano configuration types
 */

export type NodeType = 'Directory' | 'SlateText' | 'Markdown'

export interface ManoNode {
  id: string
  name: string
  unread?: number
  moreInfo?: string[]
  readOnly?: boolean
  nodeType: NodeType
  children?: ManoNode[]
}

export interface ManoConfig {
  data: ManoNode[]
  lastUpdated: string
}

/**
 * Convert name to safe filename by replacing invalid characters
 * Invalid characters for filenames: / \ : * ? " < > |
 */
export function nameToFilename(name: string): string {
  return name
    .trim()                          // Trim whitespace first
    .replace(/[/\\:*?"<>|]/g, '_')  // Replace invalid chars with underscore
    .replace(/\s+/g, '_')            // Replace all whitespace with single underscore
    .replace(/_+/g, '_')             // Collapse multiple underscores
    .replace(/^_+|_+$/g, '')         // Remove leading/trailing underscores
}

/**
 * Get full filename with extension based on node type
 */
export function getNodeFilename(node: ManoNode): string {
  const safeName = nameToFilename(node.name)
  
  switch (node.nodeType) {
    case 'SlateText':
      return `${safeName}.mano`
    case 'Markdown':
      return `${safeName}.md`
    case 'Directory':
      return safeName
    default:
      return safeName
  }
}

/**
 * Default empty Slate content
 */
export const DEFAULT_SLATE_CONTENT = [
  {
    type: 'p',
    children: [{ text: '' }]
  }
]

/**
 * Create default mano.conf.json structure
 */
export function createDefaultManoConfig(): ManoConfig {
  return {
    data: [
      {
        id: '1',
        name: '未命名项目',
        nodeType: 'Directory',
        readOnly: false,
        children: [
          {
            id: '1-1',
            name: '欢迎',
            nodeType: 'SlateText',
            readOnly: false
          }
        ]
      }
    ],
    lastUpdated: new Date().toISOString()
  }
}
