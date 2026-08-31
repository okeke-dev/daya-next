// Plain-Node import of the packaged root entry.
//
// Under Node there is no `react-server` export condition, so the `server-only`
// marker package resolves to its guarding `index.js`, which throws at import
// time. This proves the guard survives bundling and shipping: a browser / client
// module that imports the package fails fast instead of silently receiving
// secret-reading code.
await import("../../dist/index.js");

console.log("LOADED");
