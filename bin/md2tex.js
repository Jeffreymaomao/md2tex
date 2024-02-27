#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs/promises';
import path from 'path';
import { md2ast } from '../lib/parse.js';
import { ast2tex } from '../lib/transformer.js';

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
        const tex = ast2tex(ast);
        await fs.writeFile(outputFile, tex);
        console.log(`Markdown in: ${inputFile}`);
        console.log(`LaTeX out: ${outputFile}`);
    } catch (err) {
        console.error(err);
    }
};

processFile(inputFile, outputFile);