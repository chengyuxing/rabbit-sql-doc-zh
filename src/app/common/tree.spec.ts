import {DataNode, Tree} from './tree';

interface Node extends DataNode<Node, number> {
  name: string;
  payload?: {value: number};
}

describe('Tree moveNode and filterTree', () => {
  let tree: Tree<Node, number>;
  const ids = (nodes: Node[]) => nodes.map(node => node.id);

  beforeEach(() => {
    tree = new Tree<Node, number>([
      {id: 1, name: 'root'},
      {id: 2, pid: 1, name: 'branch'},
      {id: 3, pid: 2, name: 'leaf', payload: {value: 1}},
      {id: 4, pid: 1, name: 'sibling'},
      {id: 5, name: 'other root'},
      {id: 6, pid: 99, name: 'orphan'},
      {id: 7, pid: 6, name: 'orphan child'},
    ]);
  });

  it('moves a subtree while preserving instances and index order', () => {
    const branch = tree.getNode(2)!;
    const leaf = tree.getNode(3)!;
    tree.moveNode(2, 5);
    expect(ids(tree.getNode(1)!.children!)).toEqual([4]);
    expect(tree.getNode(5)!.children).toEqual([branch]);
    expect(tree.getNode(2)).toBe(branch);
    expect(branch.pid).toBe(5);
    expect(branch.parent).toBe(tree.getNode(5));
    expect(branch.children).toEqual([leaf]);
    expect(leaf.parent).toBe(branch);
    expect(tree.search(() => true)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('moves roots under a parent and appends children to roots', () => {
    tree.moveNode(5, 1);
    expect(ids(tree.roots)).toEqual([1]);
    expect(ids(tree.getNode(1)!.children!)).toEqual([2, 4, 5]);
    tree.moveNode(2, null);
    expect(ids(tree.roots)).toEqual([1, 2]);
    expect(tree.getNode(2)!.pid).toBeNull();
    expect(tree.getNode(2)!.parent).toBeUndefined();
    tree.moveNode(4);
    expect(ids(tree.roots)).toEqual([1, 2, 4]);
  });

  it('keeps order when moving to the current parent, including nullish roots', () => {
    tree.moveNode(2, 1);
    tree.moveNode(1, null);
    tree.moveNode(5);
    expect(ids(tree.getNode(1)!.children!)).toEqual([2, 4]);
    expect(ids(tree.roots)).toEqual([1, 5]);
  });

  it('moves orphan branches into the tree and detaches children of orphans', () => {
    tree.moveNode(7, 1);
    expect(tree.getNode(6)!.children).toEqual([]);
    expect(ids(tree.getNode(1)!.children!)).toEqual([2, 4, 7]);
    tree.moveNode(6, null);
    expect(ids(tree.roots)).toEqual([1, 5, 6]);
  });

  it('moves a whole orphan subtree into the tree', () => {
    tree.moveNode(6, 5);
    expect(tree.getNode(6)!.parent).toBe(tree.getNode(5));
    expect(tree.getNode(7)!.parent).toBe(tree.getNode(6));
    expect(ids(tree.toFlat())).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('rejects missing nodes and cyclic moves without changing structure', () => {
    const before = tree.toFlat();
    const branch = tree.getNode(2)!;
    expect(() => tree.moveNode(88, 1)).toThrowError('Node not found: 88');
    expect(() => tree.moveNode(2, 88)).toThrowError('Parent node not found: 88');
    expect(() => tree.moveNode(2, 2)).toThrowError('Move would create a cycle: 2 -> 2');
    expect(() => tree.moveNode(1, 3)).toThrowError('Move would create a cycle: 1 -> 3');
    expect(tree.toFlat()).toEqual(before);
    expect(tree.getNode(2)).toBe(branch);
    expect(branch.parent).toBe(tree.getNode(1));
    expect(tree.size).toBe(7);
  });

  it('rejects a destination with a malformed ancestor cycle', () => {
    tree.getNode(5)!.parent = tree.getNode(5);
    expect(() => tree.moveNode(2, 5)).toThrowError('Move would create a cycle: 2 -> 5');
    expect(ids(tree.getNode(1)!.children!)).toEqual([2, 4]);
    expect(tree.getNode(2)!.pid).toBe(1);
  });

  it('retains matches and ancestors without retaining unrelated descendants', () => {
    const result = tree.filterTree(node => node.id === 3 || node.id === 5);
    expect(ids(result.toFlat())).toEqual([1, 2, 3, 5]);
    expect(ids(tree.filterTree(node => node.id === 2).toFlat())).toEqual([1, 2]);
    expect(ids(tree.filterTree(node => node.id === 1).toFlat())).toEqual([1]);
  });

  it('evaluates each indexed node once in index order, including orphans', () => {
    tree.moveNode(2, 5);
    const visited: number[] = [];
    tree.filterTree(node => {
      visited.push(node.id);
      return true;
    });
    expect(visited).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('returns independent nodes and links while shallow-copying payload objects', () => {
    const result = tree.filterTree(node => node.id === 3);
    for (const id of [1, 2, 3]) {
      expect(result.getNode(id)).not.toBe(tree.getNode(id));
      expect(result.getNode(id)!.children).not.toBe(tree.getNode(id)!.children);
    }
    expect(result.getNode(3)!.parent).toBe(result.getNode(2));
    expect(result.getNode(2)!.parent).toBe(result.getNode(1));
    expect(result.getNode(3)!.payload).toBe(tree.getNode(3)!.payload);
    result.moveNode(3, null);
    result.getNode(2)!.name = 'changed';
    expect(tree.getNode(3)!.parent).toBe(tree.getNode(2));
    expect(ids(tree.getNode(2)!.children!)).toEqual([3]);
    expect(tree.getNode(2)!.name).toBe('branch');
    expect(tree.size).toBe(7);
  });

  it('preserves current root and sibling order after moves and indexes in traversal order', () => {
    tree.moveNode(2, 5);
    tree.moveNode(2, 1);
    tree.moveNode(1, 5);
    tree.moveNode(1, null);
    const result = tree.filterTree(() => true);
    expect(ids(result.roots)).toEqual([5, 1]);
    expect(ids(result.getNode(1)!.children!)).toEqual([4, 2]);
    expect(result.search(() => true)).toEqual([5, 1, 4, 2, 3, 6, 7]);
  });

  it('keeps matched orphan branches indexed without promoting them to roots', () => {
    const result = tree.filterTree(node => node.id === 7);
    expect(result.roots).toEqual([]);
    expect(result.size).toBe(2);
    expect(result.search(() => true)).toEqual([6, 7]);
    expect(result.getNode(6)!.pid).toBe(99);
    expect(result.getNode(6)!.parent).toBeUndefined();
    expect(result.getNode(7)!.parent).toBe(result.getNode(6));
    expect(result.getNode(6)).not.toBe(tree.getNode(6));
    result.moveNode(6, null);
    expect(ids(result.toFlat())).toEqual([6, 7]);
    expect(tree.getNode(6)!.pid).toBe(99);
  });

  it('returns an empty tree for no matches or empty input', () => {
    expect(tree.filterTree(() => false).size).toBe(0);
    expect(tree.filterTree(() => false).roots).toEqual([]);
    expect(new Tree<Node, number>([]).filterTree(() => true).size).toBe(0);
  });

  it('supports string IDs, including an empty string parent ID', () => {
    interface StringNode extends DataNode<StringNode, string> {name: string}
    const strings = new Tree<StringNode, string>([{id: '', name: 'root'}, {id: 'leaf', name: 'leaf'}]);
    strings.moveNode('leaf', '');
    const result = strings.filterTree(node => node.id === 'leaf');
    expect(result.size).toBe(2);
    expect(result.getNode('leaf')!.parent).toBe(result.getNode(''));
    expect(result.roots.map(node => node.id)).toEqual(['']);
  });

  it('filters a deep tree without recursive traversal or stack overflow', () => {
    const count = 12000;
    const deep = new Tree<Node, number>(Array.from({length: count}, (_, id) => ({
      id, pid: id === 0 ? null : id - 1, name: String(id),
    })));
    const result = deep.filterTree(node => node.id === count - 1);
    expect(result.size).toBe(count);
    expect(ids(result.roots)).toEqual([0]);
    expect(result.getNode(count - 1)!.parent).toBe(result.getNode(count - 2));
  });
});
