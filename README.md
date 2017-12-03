# ctagsx README
A working cross-platform ctags implementation.

## Setup
ctagsx requires a tags file to work. This may be generated using [Exuberant Ctags](http://ctags.sourceforge.net). To generate the tags file, a suggested run is:

```
ctags --tag-relative --extra=f -R .
```

This will generate a file called `tags`. This may be placed in the same folder as the source file being edited, or any of its parent directories. ctagsx will search and use the tags file that is closest to the source file. The tags file may be named either `tags` or `.tags`.

As of version 1.0.6, ctagsx integrates directly as a definition provider (Go to definition - `F12` or `Ctrl+left click`). This feature may be optionally disabled.

Separate to this, ctagsx also provides another searching mechanism; to search for a tag, press `Ctrl+t`/`Cmd+t`. To jump back to where you searched for a tag, press `Alt+t`. To manually enter the tag to jump to, press `Ctrl+alt+t`/`Cmd+alt+t`.

## Features
* Is cross platform
* Remains relatively fast even on large tags files
* Searches tags files relative to the source file being edited

## Extension Settings
* `ctagsx.openAsPreview`: Controls if the navigated file will be opened in preview mode (default: `false`)
* `ctagsx.disableDefinitionProvider`: Setting this to true prevents ctagsx from providing definitions via this interface (default: `false`).

## Known Issues
Please report any issues to https://github.com/jtanx/ctagsx/issues

* It is assumed that tags files are sorted, as ctagsx will only perform a binary search on the tags file. If the file is not sorted, then it may generate incorrect results.
* Use while editing very large files may not be supported, due to [limitations](https://github.com/Microsoft/vscode/issues/3147) of Visual Studio Code.
* If the navigated-to line contains multiple occurrences of the tag name, the cursor is only placed at the first occurrence.

## Release Notes
Please refer to the [changelog](CHANGELOG.md).
