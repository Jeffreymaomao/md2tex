#!/usr/bin/env node

const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const fs = require('fs').promises;
const path = require('path');
const { md2ast } = require('../lib/parse.js');
const { ast2tex } = require('../lib/transformer.js');

// 解析命令行参数
const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 <inputFile> -o [outputFile]')
    .demandCommand(1)
    .option('o', {
        alias: 'output',
        describe: 'Output file path',
        type: 'string',
        requiresArg: true,
        demandOption: false
    })
    .help()
    .argv;

const inputFile = argv._[0];
const outputFile = argv.o;

// 读取文件，转换并写入输出
const processFile = async (inputFile, outputFile) => {
    if (!outputFile) {
        const outputFileName = path.basename(inputFile, path.extname(inputFile)) + '.tex';
        outputFile = path.join(path.dirname(inputFile), outputFileName);
    }
    try {
        const data = await fs.readFile(inputFile, { encoding: 'utf8' });
        const ast = md2ast(data);
        // console.log(JSON.stringify(ast,null,2))
        const tex = ast2tex(ast);
        await fs.writeFile(outputFile, tex);
        console.log(`Markdown in: ${inputFile}`);
        console.log(` LaTeX  out: ${outputFile}`);
    } catch (err) {
        console.error(err);
    }
};

processFile(inputFile, outputFile);