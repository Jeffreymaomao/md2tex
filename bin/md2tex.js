import { md2ast } from '../lib/parse.js';
import { ast2tex } from '../lib/transformer.js';
import { readFile, writeFile } from 'fs';
import { createInterface } from 'readline';

const readLineInterface = createInterface({
    input: process.stdin,
    output: process.stdout
});

readLineInterface.question('file name: ', (filename) => {

    readFile(`./${filename}.md`, { encoding: 'utf8' }, (err, data) => {
        if (err){console.error(err);return;}

        const ast = md2ast(data);
        const tex = ast2tex(ast);

        writeFile(`./${filename}.tex`, tex, function(err) {
            if (err) console.log(err);
            console.log(`markdown in : ./${filename}.md`);
            console.log(`LaTeX out   : ./${filename}.tex`);
        });


    });

    readLineInterface.close();
});