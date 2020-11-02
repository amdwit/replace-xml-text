# replace-xml-text

Replaces text in text nodes of xml or html.

## Installing

npm install replace-xml-text

## How to use

the first argument are nodes from htmlparser2

the second argument can be string or RegExp

the third argument can be a function like for String.prototype.replace

## Example

```javascript 1.8
var replaceXmlText = require("replace-xml-text");
var {parseDOM} = require('htmlparser2');
var {default:render} = require('dom-serializer/lib');

const text='<html><body><p><span><span>a</span>b</span>c</html>';
const xml=parseDOM(text);
replaceXmlText.replace(xml,'abc','def');
const result=render(xml);
console.log(result);
```
