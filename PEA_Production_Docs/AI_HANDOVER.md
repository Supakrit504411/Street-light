# AI Handover

## Project Purpose
PEA workflow tracking system for tracking request lifecycle.

## Key Files
- Code.gs: backend API
- public/js/*: frontend modules
- public/config.js: API endpoint

## Important Constants
- SHEET_ID
- SHEET_NAME=WBS
- LOG_SHEET_NAME=LOG
- CONFIG_SHEET_NAME=CONFIG

## Known Risks
- Public GAS endpoint
- Credentials stored in sheet
- No JWT/OAuth
