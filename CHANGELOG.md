# Change Log
All notable changes to the "ctagsx" extension will be documented in this file.

## [Unreleased]
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