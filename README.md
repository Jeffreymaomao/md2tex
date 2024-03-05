# md2tex

`md2tex` is a command-line tool for converting Markdown files into LaTeX format. Written in Node.js, it's easy to install and use.

## Installation

- For those who have Node.js and npm
    ```
    npm install -g md2tex
    ```

- For those who don't have Node.js and npm
    Currently, `md2tex` can be installed by downloading the pre-compiled binary file. Please select the appropriate version for your operating system.

    [Download for macOS](https://github.com/Jeffreymaomao/md2tex/releases/download/v1.0.2/md2tex-macos)
    [Download for Windows](https://github.com/Jeffreymaomao/md2tex/releases/download/v1.0.2/md2tex-win.exe)
    [Download for Linux](https://github.com/Jeffreymaomao/md2tex/releases/download/v1.0.2/md2tex-linux)

## Usage

Using `md2tex` is straightforward. To convert a Markdown file to LaTeX format, use the following command in the terminal:

```bash
md2tex <inputFile.md> -o <outputFile.tex>
```

### Parameters

- `<inputFile.md>`: The path to the Markdown file you want to convert.
- `-o <outputFile.tex>`: (Optional) Specifies the path of the output file. If this option is not provided, a `.tex` file with the same name will be created in the same directory as the input file.

## Example

To convert `input.md` to LaTeX format and save it as `output.tex`:

```bash
md2tex input.md -o output.tex
```

If you do not specify an output file:

```bash
md2tex input.md
```

This will create `output.tex` in the same directory as `input.md`.

## Changelog

> I apologize for the frequent updates and modifications. This is my first time creating a tool like this with Node.js, and there are many aspects I didn't fully consider.

### v1.0.5

- 2024/03/05
- **Added**: Added functionality for converting `table`.
- **Added**: Added functionality for converting  `list` within `blockquote`.

### v1.0.4

- 2024/03/05
- **Fixed**: Fixed some issues within `display-math` functionality.

### v1.0.3

- 2024/03/05
- **Added**: Added functionality for converting `display-math` within `blockquote`.

### v1.0.2

- 2024/02/29
- **Added**: Introduced functionality for converting `underline`.

### v1.0.1

- 2024/02/28
- **Added**: Implemented functionality for converting `blockquote/display-code`.

### v1.0.0

- 2024/02/27
- **Added**: Released the initial version, which includes basic functionality for conversions (`display-math`, `inline-math`, `inline-code`, `bold`, `italic`, etc.).

## License

`md2tex` is released under the MIT license. For more information, see the [LICENSE](LICENSE) file.