import { md2ast } from '../../lib/parse.js';
import { readFile, writeFile } from 'fs';

const filename = "test.zh-TW";

readFile(`./${filename}.md`, { encoding: 'utf8' }, (err, data) => {
    if (err) console.error(err);

    const ast = md2ast(data);

    writeFile(`./${filename}.ast.json`, JSON.stringify(ast, null, "\t"), function (err) {
        if (err) console.log(err);
        console.log(`markdown.in  : ./${filename}.md`);
        console.log(`ast out      : ./${filename}.ast.json`);
    });

    
});