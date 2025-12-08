import type { ManoNode } from '@/types/mano-config'

export type Path = number[] // indices from root

export function cloneTree(tree: ManoNode[]): ManoNode[] {
  return JSON.parse(JSON.stringify(tree))
}

export function findNodePath(tree: ManoNode[], id: string, path: Path = []): Path | null {
  for (let i = 0; i < tree.length; i++) {
    const node = tree[i]
    const currentPath = [...path, i]
    if (node.id === id) return currentPath
    if (node.children && node.children.length) {
      const p = findNodePath(node.children, id, currentPath)
      if (p) return p
    }
  }
  return null
}

type WithChildren = { children: ManoNode[] }

export function getNodeByPath(tree: ManoNode[], path: Path): ManoNode | null {
  let cur: WithChildren | ManoNode = { children: tree }
  for (const idx of path) {
    const children: ManoNode[] | undefined = (cur as ManoNode).children ?? (cur as WithChildren).children
    if (!children || children[idx] === undefined) return null
    cur = children[idx]
  }
  return cur as ManoNode
}

export function getParentByPath(tree: ManoNode[], path: Path): { parent: ManoNode | null; list: ManoNode[] } {
  if (path.length === 0) return { parent: null, list: tree }
  const parentPath = path.slice(0, -1)
  const parent = parentPath.length ? getNodeByPath(tree, parentPath) : null
  const list = parent ? (parent.children ?? (parent.children = [])) : tree
  return { parent, list }
}

export function removeAtPath(tree: ManoNode[], path: Path): { removed: ManoNode; newTree: ManoNode[] } {
  const newTree = cloneTree(tree)
  const { list } = getParentByPath(newTree, path)
  const idx = path[path.length - 1]
  const [removed] = list.splice(idx, 1)
  return { removed, newTree }
}

export function insertInto(tree: ManoNode[], targetId: string, node: ManoNode): ManoNode[] {
  const newTree = cloneTree(tree)
  const targetPath = findNodePath(newTree, targetId)
  if (!targetPath) return newTree
  const target = getNodeByPath(newTree, targetPath)!
  target.children = target.children ?? []
  target.children.push(node)
  return newTree
}

export function insertBeforeAfter(tree: ManoNode[], targetId: string, node: ManoNode, mode: 'before' | 'after'): ManoNode[] {
  const newTree = cloneTree(tree)
  const targetPath = findNodePath(newTree, targetId)
  if (!targetPath) return newTree
  const { list } = getParentByPath(newTree, targetPath)
  const targetIdx = targetPath[targetPath.length - 1]
  const insertIdx = mode === 'before' ? targetIdx : targetIdx + 1
  list.splice(insertIdx, 0, node)
  return newTree
}

export function isAncestor(tree: ManoNode[], ancestorId: string, nodeId: string): boolean {
  const aPath = findNodePath(tree, ancestorId)
  const nPath = findNodePath(tree, nodeId)
  if (!aPath || !nPath) return false
  return nPath.length >= aPath.length && aPath.every((v, i) => v === nPath[i])
}

/**
 * Check if there are text nodes (SlateText or Markdown) with the same name in the entire workspace
 * Because text nodes correspond to physical files, filenames must be unique within the same directory
 * @param tree The entire node tree
 * @param name The name to check
 * @param excludeId The node ID to exclude (for rename scenarios, exclude itself)
 * @returns true if duplicate name exists, false if no duplicate
 */

/**
 * Build a Set of all node names in the tree (including ALL node types)
 * Used for global name uniqueness validation
 * Time: O(n), Space: O(n)
 */
export function buildTextNodeNameSet(tree: ManoNode[]): Set<string> {
  const nameSet = new Set<string>()
  
  function traverse(nodes: ManoNode[]) {
    for (const node of nodes) {
      nameSet.add(node.name)
      if (node.children) {
        traverse(node.children)
      }
    }
  }
  
  traverse(tree)
  return nameSet
}

/**
 * Check if a node name exists in a pre-built name Set
 * Time: O(1), Space: O(1)
 */
export function hasNameInSet(nameSet: Set<string>, name: string): boolean {
  return nameSet.has(name)
}

/**
 * Check for duplicate node names in the tree (checks ALL node types)
 * Returns array of duplicates with their IDs
 */
export function checkDuplicateNames(tree: ManoNode[]): Array<{ name: string; ids: string[] }> {
  const duplicates: Array<{ name: string; ids: string[] }> = []
  const allNodeNames = new Map<string, string[]>()
  
  function collectNodes(nodes: ManoNode[]) {
    for (const node of nodes) {
      const ids = allNodeNames.get(node.name) || []
      ids.push(node.id)
      allNodeNames.set(node.name, ids)
      
      if (node.children && node.children.length > 0) {
        collectNodes(node.children)
      }
    }
  }
  
  collectNodes(tree)
  
  for (const [name, ids] of allNodeNames.entries()) {
    if (ids.length > 1) {
      duplicates.push({ name, ids })
    }
  }
  
  return duplicates
}

/**
 * Check if a node is in the trash
 * @param tree The entire node tree
 * @param nodeId The node ID to check
 * @returns true if in trash, false if not
 */
export function isInTrash(tree: ManoNode[], nodeId: string): boolean {
  const trashPath = findNodePath(tree, '__trash__')
  if (!trashPath) return false
  
  const nodePath = findNodePath(tree, nodeId)
  if (!nodePath) return false
  
  // Check if nodePath starts with trashPath
  return trashPath.every((v, i) => v === nodePath[i])
}
