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
