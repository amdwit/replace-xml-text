var { default: render } = require("dom-serializer/lib");
import { parseDOM } from "htmlparser2";
import { replace } from "./index";

describe("replace", function () {
  it("should 1", function () {
    const text = "<html><body><p>a</p></body></html>";
    const xml = parseDOM(text);
    replace(xml, "a", "b");
    const result = render(xml);
    expect(result).toBe("<html><body><p>b</p></body></html>");
  });

  it("should 2", function () {
    const text = "<html><body><p>a</p><p>b</p></body></html>";
    const xml = parseDOM(text);
    replace(xml, "ab", "c");
    const result = render(xml);
    expect(result).toBe("<html><body><p>c</p><p></p></body></html>");
  });

  it("should 3", function () {
    const text = "<html><body><p>abcad</p><p>efgh</p></body></html>";
    const xml = parseDOM(text);
    replace(xml, "a", "c");
    const result = render(xml);
    expect(result).toBe("<html><body><p>cbcad</p><p>efgh</p></body></html>");
  });

  it("should 4", function () {
    const text = "<html><body><p>abcad</p><p>efagh</p></body></html>";
    const xml = parseDOM(text);
    replace(xml, /a/g, "c");
    const result = render(xml);
    expect(result).toBe("<html><body><p>cbccd</p><p>efcgh</p></body></html>");
  });

  it("should 5", function () {
    const text = "<html><body><p>abcad</p><p>efagh</p></body></html>";
    const xml = parseDOM(text);
    const f: (match: RegExpExecArray) => string = (substring) => "c";
    replace(xml, /a/g, f);
    const result = render(xml);
    expect(result).toBe("<html><body><p>cbccd</p><p>efcgh</p></body></html>");
  });

  it("should 6", function () {
    const text = "<html><body><p>abcadaa</p><p>aaefagh</p></body></html>";
    const xml = parseDOM(text);
    replace(xml, /a/g, (substring) => "c");
    const result = render(xml);
    expect(result).toBe(
      "<html><body><p>cbccdcc</p><p>ccefcgh</p></body></html>"
    );
  });

  it("should 7", function () {
    const text = "<html><body><p>abcadaa</p><p>aaefagh</p></body></html>";
    const xml = parseDOM(text);
    replace(xml, /a/g, (substring) => [{ skip: 0, toDelete: 1, text: "c" }]);
    const result = render(xml);
    expect(result).toBe(
      "<html><body><p>cbccdcc</p><p>ccefcgh</p></body></html>"
    );
  });

  it("should 8", function () {
    const text = "<html><body><p><span><span>a</span>b</span>c</html>";
    const xml = parseDOM(text);
    replace(xml, "abc", "def");
    const result = render(xml);
    expect(result).toBe(
      "<html><body><p><span><span>def</span></span></p></body></html>"
    );
  });
});
