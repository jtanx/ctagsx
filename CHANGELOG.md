# Change Log
All notable changes to the "ctagsx" extension will be documented in this file.

## [1.1.0] - 2019-02-14
### Fixed
- Fixed tag searching for VSCode 1.31

## [1.0.9] - 2018-08-11
### Fixed
- Prevent folders that match the tag file pattern (e.g. `tags` or `.tags`) from being considered as a tags file

## [1.0.8] - 2017-12-16
### Added
- Added a command to create a terminal in the workspace of the active document (key binding: unbound)

## [1.0.7] - 2017-12-04
### Fixed
- Fixed a regression when jumping to a positional (line-based) tag

## [1.0.6] - 2017-12-03
### Added
- Registered ctagsx as a definition provider for *all* languages (integration into VSCode's definition provider interface). May be disabled by setting `ctagsx.disableDefinitionProvider` to `true`.

## [1.0.5] - 2017-10-07
### Fixed
- Reverted use of `vscode.ViewColumn.Active` for backwards compatibility/minimum version mismatch (currently specifies 1.15.0 as minimum, but `vscode.ViewColumn.Active` is present only in 1.17.0)

## [1.0.4] - 2017-10-07
### Added
- Added a new command to manually enter the tag to jump to via an input prompt (default: `Ctrl+alt+t`/`Cmd+alt+t`)
- Added a preference (`ctagsx.openAsPreview`) to open the navigated file in preview mode (default: `false`). This restores to default behaviour as observed pre VSCode 1.15.

## [1.0.3] - 2017-05-13
### Fixed
- Fix jumping to tags when editing an untitled document (default to using workspace root to search for tags)

### Added
- Added jump stack to allow jumping back to previous location where 'Navigate to definition' was called (default: `Alt+t`)
- Added method to clear jump stack (not bound to any hotkey)

## [1.0.2] - 2017-05-07
### Fixed
- Fix off-by-one error when navigating to file line number
- Fix not navigating to line when ctags defines address only by line number

## [1.0.1] - 2017-05-07
### Added
- Added handling for file names in the format of `file_name:line_number:char_number`, e.g. `stemdb.c:3513:30`, where `file_name` is the text selected for lookup. It will now jump to the specified line number, and if given, the character position.

### Changed
- Display the absolute path to the file in the drop-down selection
- Account for having absolute file paths as provided directly by the tags file
- When navigating to the line within a file, also move the cursor to the start of the tag on that line. ctagsx will only move to the first occurrence of the tag on the line; it does not delineate _which_ occurrence it should move to.

### Fixed
- Open the definition in the same view column as the active editor, instead of always in the first

## [1.0.0] - 2017-05-04
- Initial release