/**
 * Mano configuration types
 */

export type NodeType = 'Directory' | 'SlateText' | 'Markdown'

export interface ManoNode {
  id: string
  name: string
  metadata?: Record<string, unknown>
  readOnly?: boolean
  nodeType: NodeType
  children?: ManoNode[]
  content?: string  // Base64 encoded content for deleted nodes in trash
  expanded?: boolean  // Whether the directory node is expanded (default: false for collapsed)
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
        name: '我的连载...',
        metadata: {
          '连载中': true,
          '计划': '80回',
          '已完成': '1回'
        },
        readOnly: false,
        nodeType: 'Directory',
        children: []
      },
      {
        id: '__trash__',
        name: '垃圾篓',
        readOnly: true,
        nodeType: 'Directory',
        children: []
      }
    ],
    lastUpdated: new Date().toISOString()
  }
}
