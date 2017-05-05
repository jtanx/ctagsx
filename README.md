# ctagsx README
A working cross-platform ctags implementation.

## Setup
ctagsx requires a tags file to work. This may be generated using [Exuberant Ctags](http://ctags.sourceforge.net). To generate the tags file, a suggested run is:

```
ctags --tag-relative --extra=f -R .
```

This will generate a file called `tags`. This may be placed in the same folder as the source file being edited, or any of its parent directories. ctagsx will search and use the tags file that is closest to the source file. The tags file may be named either `tags` or `.tags`.

To search for a tag, press `Ctrl+t`/`Cmd+t`.

## Features
* Is cross platform
* Remains relatively fast even on large tags files
* Searches tags files relative to the source file being edited

## Extension Settings
None at the moment

## Known Issues
* It is assumed that tags files are sorted, as ctagsx will only perform a binary search on the tags file. If the file is not sorted, then it may generate incorrect results.
* It is not possible to search for tags when editing a large file (>= 5MB). This is a [limitation](https://github.com/Microsoft/vscode/issues/3147) of Visual Studio Code.

## Release Notes

### 1.0.0

Initial release of ctagsx

