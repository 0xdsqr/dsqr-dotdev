{
  runCommand,
  nodejs_24,
  app,
  appName,
  port,
}:

runCommand "${appName}-http-smoke"
  {
    nativeBuildInputs = [
      nodejs_24
      app
    ];
    __darwinAllowLocalNetworking = true;
  }
  ''
    export HOST=127.0.0.1 PORT=${toString port}
    ${appName} > server.log 2>&1 &
    server_pid=$!
    trap 'kill "$server_pid" 2>/dev/null || true' EXIT

    node --input-type=module <<'JS' || { cat server.log; exit 1; }
    import assert from 'node:assert/strict';
    import { setTimeout } from 'node:timers/promises';

    const origin = 'http://127.0.0.1:${toString port}';
    let response;
    for (let attempt = 0; attempt < 50; attempt++) {
      try {
        response = await fetch(origin, { signal: AbortSignal.timeout(1000) });
        break;
      } catch {
        await setTimeout(100);
      }
    }
    assert.ok(response, 'Production server must start');
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /<h1[^>]*>${
      {
        dotdev = "\\s*0xdsqr\\s*";
        labs = "\\s*<svg[^>]*>.*<\\/svg>\\s*<span[^>]*>DSQR Labs LLC<\\/span>\\s*";
        studio = "Hello, studio\\.";
      }
      .${appName}
    }<\/h1>/, 'Home page must be server-rendered');

    assert.match(html, /<footer[^>]*>/, 'Shared footer must be server-rendered');

    const api = await fetch(origin + '/api/health', { signal: AbortSignal.timeout(1000) });
    assert.equal(api.status, 200, 'Public API must work without authentication');
    assert.deepEqual(await api.json(), { message: 'API connected.' });
    const crossOrigin = await fetch(origin + '/api/subscriptions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://example.invalid' },
      body: '{}',
      signal: AbortSignal.timeout(1000),
    });
    assert.equal(crossOrigin.status, 403, 'Cross-origin writes must be rejected');
    const livez = await fetch(origin + '/api/livez', { signal: AbortSignal.timeout(1000) });
    assert.equal(livez.status, 200, 'Liveness must not depend on anything');
    assert.equal(await livez.text(), 'ok');
    const healthz = await fetch(origin + '/api/healthz', { signal: AbortSignal.timeout(5000) });
    assert.equal(healthz.status, ${
      if appName == "dotdev" then "503" else "200"
    }, 'Health reflects dependencies (no database in the sandbox)');
    assert.equal(healthz.headers.get('cache-control'), 'no-store');
    const missingEndpoint = await fetch(origin + '/api/missing', { signal: AbortSignal.timeout(1000) });
    assert.equal(missingEndpoint.status, 404, 'Unknown API endpoints must return 404');

    const assets = [...html.matchAll(/(?:href|src)="([^"]+\.(?:css|js))"/g)].map(match => match[1]);
    assert.ok(assets.some(path => path.endsWith('.js')), 'Client bundle must be linked');
    assert.ok(assets.some(path => path.endsWith('.css')), 'Stylesheet must be linked');
    let css = "";
    for (const path of new Set(assets)) {
      const asset = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(1000) });
      assert.equal(asset.status, 200, path);
      if (path.endsWith('.css')) css += await asset.text();
    }
    assert.match(css, /min-height:\s*100svh/, 'StyleX CSS must be emitted and served');
    assert.match(css, /light-dark\(/, 'Shared light/dark theme tokens must be emitted');
    const fonts = [...css.matchAll(/url\(["']?([^\s"')]+\.woff2)["']?\)/g)].map(match => match[1]);
    assert.ok(fonts.length > 0, 'Shared Geist fonts must be bundled');
    for (const path of new Set(fonts)) {
      assert.equal((await fetch(new URL(path, origin))).status, 200, path);
    }
    assert.equal((await fetch(origin + '/missing', { signal: AbortSignal.timeout(1000) })).status, 404);
    console.log('SSR, public API, origin guard, probes, client assets, shared styles/fonts, and 404 responses passed');
    JS

    touch "$out"
  ''
