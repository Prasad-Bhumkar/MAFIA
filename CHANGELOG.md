# MAFIA Changelog

## v1.1.2 (2023-11-15)
### Added
- Documentation registry system (FILE_REGISTRY.md)
- Version badges and modernized README structure
- Automated documentation tracking

### Changed
- Updated README.md with:
  - Version badge from package.json  
  - Modern frontmatter and feature highlights
  - Improved getting started section
  - Technical architecture diagram
  - Better documentation links

## v1.1.1 (2023-11-15)
### Bug Fixes
- Fixed memory leak in dependency analysis (#142)
- Resolved race condition in suggestion provider (#145)
- Fixed visualization rendering issues (#151)

## v1.1.0 (2023-10-20)
### New Features
- Integrated GPT-4 Turbo model support
- 3x faster dependency visualizations
- Expanded to 50+ code quality metrics
- Rebranded from "IndiCab Spring Analyzer" to MAFIA
- Updated all command prefixes from `indiCab` to `mafia`
- Migrated configuration settings from `indicab` to `mafia`

### Enhancements
- Improved error handling and recovery
- Added Redis-based caching layer
- Implemented Tailwind CSS for all UI components
- Added WebSocket streaming for real-time updates

### Known Issues
- Large projects (>1000 files) may experience slower initial scan
- Some edge cases in architecture pattern detection
- Intermittent WebSocket disconnects under heavy load

## Planned for v1.2.0 (Q1 2024)
### UI Improvements
- Complete Tailwind CSS modernization
- Interactive dependency graph visualization
- Real-time architecture validation overlay

### AI Enhancements  
- Multi-model support (OpenAI, Anthropic, Local)
- Suggestion quality scoring system
- Context-aware code transformations

### Performance
- API response caching
- Exponential backoff for failed requests
- Lazy loading for large projects
