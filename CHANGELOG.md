# MAFIA Changelog

## v1.1.1 (Current)
### Bug Fixes
- Memory leak in dependency analysis
- Race condition in suggestion provider
- Visualization rendering issues

## v1.1.0
### New Features
- GPT-4 Turbo integration
- 3x faster visualizations
- 50+ quality metrics
- Rebranded as MAFIA (from "IndiCab Spring Analyzer")
- Updated all command prefixes from `indiCab` to `mafia`
- Updated all configuration settings from `indicab` to `mafia`

### Enhancements
- Improved error handling
- Caching layer implementation
- Tailwind CSS integration

### Known Issues
- Large projects (>1000 files) may experience slower initial scan
- Some edge cases in architecture pattern detection

## Planned for v1.2.0
- Tailwind CSS UI modernization
- Real-time architecture validation
- Interactive dependency graph
- Multi-model AI support
- API response caching
- Exponential backoff for failed requests
