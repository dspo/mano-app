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
 * 检查整个工作区中是否有同名的文本节点（SlateText 或 Markdown）
 * 因为文本节点对应物理文件，文件名在同一目录下必须唯一
 * @param tree 整个节点树
 * @param name 要检查的名称
 * @param excludeId 排除的节点 ID（用于重命名场景，排除自身）
 * @returns true 表示有重名，false 表示没有重名
 */
export function hasTextNodeWithName(tree: ManoNode[], name: string, excludeId?: string): boolean {
  function search(nodes: ManoNode[]): boolean {
    for (const node of nodes) {
      // 只检查文本节点（SlateText 和 Markdown），Directory 不对应文件
      if ((node.nodeType === 'SlateText' || node.nodeType === 'Markdown') && 
          node.name === name && 
          node.id !== excludeId) {
        return true
      }
      if (node.children) {
        if (search(node.children)) return true
      }
    }
    return false
  }
  return search(tree)
}

/**
 * 验证整个树结构，检查工作区中是否有重名的文本节点
 * 因为文本节点对应物理文件，文件名在整个工作区必须唯一
 * @param tree 要检查的树结构
 * @returns 包含重名信息的数组，如果为空则表示没有重名
 */
export function checkDuplicateNames(tree: ManoNode[]): Array<{ name: string; ids: string[] }> {
  const duplicates: Array<{ name: string; ids: string[] }> = []
  const textNodeNames = new Map<string, string[]>() // name -> [ids]
  
  function collectTextNodes(nodes: ManoNode[]) {
    for (const node of nodes) {
      // 只收集文本节点（SlateText 和 Markdown）
      if (node.nodeType === 'SlateText' || node.nodeType === 'Markdown') {
        const ids = textNodeNames.get(node.name) || []
        ids.push(node.id)
        textNodeNames.set(node.name, ids)
      }
      
      if (node.children && node.children.length > 0) {
        collectTextNodes(node.children)
      }
    }
  }
  
  collectTextNodes(tree)
  
  // 找出重名（出现次数 > 1）
  for (const [name, ids] of textNodeNames.entries()) {
    if (ids.length > 1) {
      duplicates.push({ name, ids })
    }
  }
  
  return duplicates
}

/**
 * 检查节点是否在垃圾篓中
 * @param tree 整个节点树
 * @param nodeId 要检查的节点 ID
 * @returns true 表示在垃圾篓中，false 表示不在
 */
export function isInTrash(tree: ManoNode[], nodeId: string): boolean {
  const trashPath = findNodePath(tree, '__trash__')
  if (!trashPath) return false
  
  const nodePath = findNodePath(tree, nodeId)
  if (!nodePath) return false
  
  // 检查 nodePath 是否以 trashPath 开始
  return trashPath.every((v, i) => v === nodePath[i])
}
