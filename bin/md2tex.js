#!/usr/bin/env node

const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const fs = require('fs').promises;
const path = require('path');
const { md2ast } = require('../lib/parse.js');
const { ast2tex } = require('../lib/transformer.js');
const { LaTeXDefaultTemplate, LatexDocumentEnvironment } = require('../lib/latex.js');

// 解析命令行參數
const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 <inputFile> -o [outputFile] [-t [templateFile]]')
    .demandCommand(1)
    .option('o', {
        alias: 'output',
        describe: 'Output file path',
        type: 'string',
        requiresArg: true,
        demandOption: false
    })
    .option('t', {
        alias: 'template',
        describe: 'Specify a LaTeX template file',
        type: 'string',
        requiresArg: false
    })
    .help()
    .argv;

const inputFile = argv._[0];
const outputFile = argv.o;
const templateFile = argv.t;

// 讀取文件，轉換並寫入寫出
const processFile = async (inputFile, outputFile) => {
    if (!outputFile) {
        const outputFileName = path.basename(inputFile, path.extname(inputFile)) + '.tex';
        outputFile = path.join(path.dirname(inputFile), outputFileName);
    }
    let needTemplate = true;
    if (templateFile===undefined) {
        // No -t 
        LatexTemplate = LaTeXDefaultTemplate; 
        needTemplate  = true;
    } else if (!templateFile){
        // -t with ''
        LatexTemplate = ''; 
        needTemplate  = false;
    } else {
        // -t with a value
        LatexTemplate = await fs.readFile(templateFile, { encoding: 'utf8' });
        needTemplate  = true;
    }

    try {
        const data = await fs.readFile(inputFile, { encoding: 'utf8' });
        const ast = md2ast(data);
        const texContent = ast2tex(ast);

        let tex = "";
        if(needTemplate){
            tex = LatexTemplate + LatexDocumentEnvironment(texContent);
        } else {
            tex = texContent;
        }
        await fs.writeFile(outputFile, tex);
        console.log(`Markdown in: ${inputFile}`);
        console.log(` LaTeX  out: ${outputFile}`);
    } catch (err) {
        console.error(err);
    }
};

processFile(inputFile, outputFile);