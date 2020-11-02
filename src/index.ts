import * as assert from "assert";
import * as domhandler from "domhandler/lib";
import * as domutils from "domutils/lib";

interface Replacement {
  skip: number;
  text: string;
  toDelete: number;
}

interface ReplaceState {
  replacementIndex: number;
  skip: number | null;
  toDelete: number;
}

function processReplacementsOnTextNode(
  replacements: Replacement[],
  state: ReplaceState,
  textNode: domhandler.Text
): ReplaceState | null {
  let current = state;
  let textIndex = 0;
  while (textIndex < textNode.data.length) {
    if (current.skip) {
      // skip some characters
      const skipped = Math.min(textNode.data.length - textIndex, current.skip);
      current.skip = current.skip - skipped;
      textIndex = textIndex + skipped;
    } else if (current.skip === 0) {
      // insert replacement string
      const pre = textNode.data.slice(0, textIndex);
      const post = textNode.data.slice(textIndex);
      const replacement = replacements[current.replacementIndex];
      textNode.data = pre + replacement.text + post;
      textIndex = textIndex + replacement.text.length;
      current.skip = null;
    } else if (current.toDelete) {
      // delete characters that were replaced
      const pre = textNode.data.slice(0, textIndex);
      const toDelete = Math.min(
        textNode.data.length - pre.length,
        current.toDelete
      );
      const post = textNode.data.slice(textIndex + toDelete);
      textNode.data = pre + post;
      current.toDelete = current.toDelete - toDelete;
    } else {
      // find next replacement
      const nextReplacement = replacements[current.replacementIndex + 1];
      if (nextReplacement) {
        current.replacementIndex = current.replacementIndex + 1;
        current.skip = nextReplacement.skip;
        current.toDelete = nextReplacement.toDelete;
      } else {
        return null;
      }
    }
  }
  return current;
}

function processReplacements(
  replacements: Replacement[],
  state: ReplaceState,
  nodes: domhandler.Node[]
): ReplaceState | null {
  let current: ReplaceState | null = state;
  for (const node of nodes) {
    if (node.type === "text") {
      current = processReplacementsOnTextNode(
        replacements,
        current,
        node as domhandler.Text
      );
    } else if ("children" in node) {
      current = processReplacements(
        replacements,
        current,
        (node as domhandler.NodeWithChildren).children
      );
    }
    if (!current) {
      return null;
    }
  }
  return current;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

export function replace(
  nodeOrNodes: domhandler.Node | domhandler.Node[],
  needle: RegExp | string,
  processMatch: string | ((...args: any[]) => string | Replacement[])
): void {
  const xml: domhandler.Node[] = Array.isArray(nodeOrNodes)
    ? nodeOrNodes
    : [nodeOrNodes];
  const text = domutils.getText(xml);
  const replacements: Replacement[] = [];

  const needleRE =
    typeof needle === "string" ? RegExp(escapeRegExp(needle)) : needle;

  let lastIndex = 0;
  let match;
  while ((match = needleRE.exec(text))) {
    const substring = match[0];
    const offset = match.index;
    const skip = offset - lastIndex;
    const toDelete = substring.length;
    lastIndex = offset + toDelete;
    const replacementsOrString =
      typeof processMatch === "string"
        ? processMatch
        : processMatch(...match, match.index, match.input, match.groups);
    if (typeof replacementsOrString === "string") {
      replacements.push({ skip, text: replacementsOrString, toDelete });
    } else {
      replacements.push({ skip, text: "", toDelete: 0 });
      if (replacementsOrString.length) {
        const toDelete2 = replacementsOrString.reduce(
          (acc, r) => acc + r.skip + r.toDelete,
          0
        );
        assert.ok(toDelete === toDelete2);
        replacements.push(...replacementsOrString);
      }
    }
    if (!needleRE.global) {
      break;
    }
  }

  if (replacements.length) {
    processReplacements(
      replacements,
      {
        replacementIndex: 0,
        toDelete: replacements[0].toDelete,
        skip: replacements[0].skip,
      },
      xml
    );
  }
}
