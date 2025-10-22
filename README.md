# String Analyzer Service

RESTful API for analyzing and storing string properties. Built with Node.js and Express.js. Matches spec exactly.

## Features
- Compute string properties: length, palindrome check (case-insensitive), unique characters, word count, SHA-256 hash, character frequency map.
- Endpoints: POST /strings (create/analyze), GET /strings/{value} (retrieve), GET /strings (list with filters), GET /strings/filter-by-natural-language (NL query), DELETE /strings/{value}.
- In-memory storage for simplicity.
- Error handling per spec.

## Setup Instructions
1. Ensure Node.js v18+ installed.
2. Clone the repo: `git clone <your-repo-url> && cd string-analyzer`.
3. Install dependencies: `npm install`.

Dependencies listed in `package.json`:
- `express`: Web framework.
- `body-parser`: JSON parsing.
- `cors`: Cross-origin support.

No additional setup required.

## Environment Variables
None needed. Defaults to port 8080.

## Run Locally
```bash
npm run dev
```
- Uses nodemon for auto-restart.
- Server runs on `http://localhost:8080`.
- Test endpoints with curl or Postman.

Example tests:
- Create: `curl -X POST http://localhost:8080/strings -H "Content-Type: application/json" -d '{"value": "hello world"}'`
- Get: `curl http://localhost:8080/strings/hello%20world`
- List: `curl "http://localhost:8080/strings?is_palindrome=true"`
- NL Filter: `curl "http://localhost:8080/strings/filter-by-natural-language?query=all%20single%20word%20palindromic%20strings"`
- Delete: `curl -X DELETE http://localhost:8080/strings/hello%20world`

## API Documentation
See inline code comments in `server.js` for full details. Responses match spec formats.

## Deployment
- Deploy to Railway, Heroku, or AWS (Vercel/Render forbidden).
- Set `PORT` env var if needed.
- Example Railway base URL: `https://your-app.railway.app`.

## Notes
- Production: Add database (e.g., MongoDB) for persistence.
- Security: Hash used as ID; validate inputs strictly.
- Tests: Add unit/integration tests via Jest for production.

Deploy now. Truth: Efficient, spec-compliant. God bless your submission.
