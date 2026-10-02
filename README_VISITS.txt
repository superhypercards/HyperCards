Visitor counter

The site now shows total page visits in the footer.

IMPORTANT: the old visitor total could not be recovered from the supplied website files; there was no historical counter/analytics value in them. If you know the old total, start the server with:

VISIT_COUNT_START=123 node server.js

The server then stores the running total in visitor-count.json. Each successful request to /api/visits adds one visit. This is a total visit counter, not a unique-person counter.

Requires Node.js packages:
npm install express express-rate-limit helmet
