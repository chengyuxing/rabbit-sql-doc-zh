export interface DataNode<T, ID> {
  id: ID;
  pid?: ID | null;
  children?: T[];
  parent?: T;
}

/**
 * 树状数据模型对象工具类
 */
export class Tree<T extends DataNode<T, ID>, ID = string | number> {
  private indexes = new Map<ID, T>();
  private treeNodes: T[] = [];

  /**
   * 根据扁平数组创建一个新实例。
   *
   * 根节点需要属性 `pid` 为 `null` 或 `undefined`。
   * @param data flatten datasource
   */
  constructor(protected data: T[]) {
    this.buildTree();
  }

  protected buildTree() {
    const clonedNodes = this.data.map(node => Object.assign({}, node));
    const roots: T[] = [];
    const idMap = new Map<ID, T>();
    for (const node of clonedNodes) {
      node.children = [];
      node.parent = undefined;
      idMap.set(node.id, node);
    }
    for (const node of clonedNodes) {
      if (node.pid === null || node.pid === undefined) {
        roots.push(node);
        continue;
      }
      const parent = idMap.get(node.pid);
      if (parent) {
        node.parent = parent;
        parent.children?.push(node);
      }
    }
    this.indexes = idMap;
    this.treeNodes = roots;
  }

  get roots(): T[] {
    return this.treeNodes;
  }

  get isEmpty(): boolean {
    return this.treeNodes.length === 0;
  }

  get rootCount(): number {
    return this.treeNodes.length;
  }

  get size(): number {
    return this.indexes.size;
  }

  getNode(id: ID): T | undefined {
    return this.indexes.get(id);
  }

  hasChildren(id: ID): boolean {
    const node = this.getNode(id);
    return node ? node.children!.length > 0 : false;
  }

  search(predicate: (node: T) => boolean): ID[] {
    const result: ID[] = [];
    this.indexes.forEach((node, id) => {
      if (predicate(node)) result.push(id);
    });
    return result;
  }

  searchWithContext(predicate: (node: T) => boolean): ID[] {
    const matched = this.search(predicate);
    const result = new Set<any>();
    matched.forEach(id => {
      result.add(id);
      this.getAncestors(id).forEach(n => result.add(n.id));
      this.getDescendants(id).forEach(n => result.add(n.id));
    });
    return Array.from(result);
  }

  addNode(pid: ID | null | undefined, node: T) {
    const existingChildren = node.children || [];
    node.children = [];
    if (pid === null || pid === undefined) {
      node.pid = null;
      node.parent = undefined;
      this.treeNodes.push(node);
    } else {
      const parent = this.getNode(pid);
      if (!parent) {
        console.warn(`[Tree] parent ${pid} not exists, add failed`);
        return;
      }
      node.pid = pid;
      node.parent = parent;
      parent.children?.push(node);
    }
    this.indexes.set(node.id, node);
    for (const child of existingChildren) {
      this.addNode(node.id, child);
    }
  }

  updateNode(id: ID, updates: Omit<Partial<T>, 'children' | 'parent'>) {
    const node = this.getNode(id);
    if (node) {
      Object.assign(node, updates);
    }
  }

  removeNode(id: ID) {
    const toDelete = new Set<ID>([id, ...this.getDescendants(id).map(n => n.id)]);
    const removeFromTree = (nodes: T[]) => {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id == id) {
          nodes.splice(i, 1);
          return true;
        }
        if (removeFromTree(nodes[i].children!)) {
          return true;
        }
      }
      return false;
    }
    removeFromTree(this.treeNodes);
    for (const id of toDelete) {
      this.indexes.delete(id);
    }
  }

  toFlat() {
    const result: T[] = [];
    const traverse = (nodes: T[]) => {
      for (const node of nodes) {
        const cleanNode = {} as T;
        for (const key in node) {
          if (key !== 'children' && key !== 'parent') {
            cleanNode[key] = node[key];
          }
        }
        result.push(cleanNode);
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      }
    };
    traverse(this.treeNodes);
    return result;
  }

  getAncestors(id: ID): T[] {
    const result: T[] = [];
    let parent: T | undefined = this.getNode(id)?.parent;
    while (parent) {
      result.push(parent);
      parent = parent.parent;
    }
    return result;
  }

  getDescendants(id: ID): T[] {
    const result: T[] = [];
    const children: T[] = this.getNode(id)?.children || [];
    for (const child of children) {
      result.push(child);
      result.push(...this.getDescendants(child.id));
    }
    return result;
  }

  getSiblings(id: ID): T[] {
    const node = this.getNode(id);
    if (!node) {
      return [];
    }
    const parent = node.parent;
    if (parent !== null && parent !== undefined) {
      return parent.children || [];
    }
    return this.roots;
  }

  getSibling(id: ID, position: 'next' | 'previous' | 'first' | 'last'): T | undefined {
    const node = this.getNode(id);
    if (!node) {
      return undefined;
    }
    const siblings = this.getSiblings(id);
    let idx = -1;
    if (position === 'next') {
      idx = siblings.indexOf(node) + 1;
    } else if (position === 'previous') {
      idx = siblings.indexOf(node) - 1;
    } else if (position === 'first') {
      idx = 0;
    } else if (position === 'last') {
      idx = siblings.length - 1;
    }
    return siblings[idx];
  }
}
