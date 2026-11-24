{
  runCommand,
  coreutils,
  gnugrep,
  nodejs_26,
  app,
  appName,
  port,
}:

runCommand "${appName}-http-smoke"
  {
    nativeBuildInputs = [
      nodejs_26
      app
      coreutils
      gnugrep
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
    const missing = await fetch(origin + '/missing', { signal: AbortSignal.timeout(1000) });
    assert.equal(missing.status, 404);
    assert.match(await missing.text(), /Page not found/, 'Unknown pages render the designed 404 page');

    // Security headers: a per-request nonce CSP on pages, and the static set everywhere.
    const csp = response.headers.get('content-security-policy') ?? "";
    const nonce = csp.match(/'nonce-([^']+)'/)?.[1];
    assert.ok(nonce, 'Pages must send a nonce-based CSP');
    assert.match(csp, /object-src 'none'/);
    assert.match(csp, /frame-ancestors 'none'/);
    const scripts = [...html.matchAll(/<script\b[^>]*>/g)].map(match => match[0]);
    assert.ok(scripts.length > 0);
    for (const tag of scripts) assert.ok(tag.includes(`nonce="''${nonce}"`), `Script lacks the CSP nonce: ''${tag}`);
    for (const headers of [response.headers, (await fetch(new URL(assets[0], origin))).headers]) {
      assert.equal(headers.get('x-content-type-options'), 'nosniff');
      assert.equal(headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
      assert.equal(headers.get('x-frame-options'), 'DENY');
    }

    // Landmarks: the footer is a sibling of main, never inside it.
    assert.ok(html.indexOf('</main>') !== -1 && html.indexOf('</main>') < html.lastIndexOf('<footer'), 'Footer must follow main');

    assert.equal((await fetch(origin + '/robots.txt')).status, 200);
    ${
      if appName == "dotdev" then
        ''
          for (const path of ['/sitemap.xml', '/manifest.webmanifest', '/about', '/blog', '/misc']) {
            assert.equal((await fetch(origin + path)).status, 200, path);
          }
          assert.match(html, /<link rel="canonical" href="https:\/\/dsqr\.dev\/"/);
          assert.match(html, /<meta property="og:image" content="https:\/\/dsqr\.dev\/assets\/og-[^"]+\.png"/);
          assert.match(await (await fetch(origin + '/about')).text(), /infrastructure/, 'About shows the intro');
        ''
      else
        ""
    }
    console.log('SSR, API, origin guard, probes, assets, styles/fonts, CSP, headers, landmarks, and 404 page passed');
    JS

    # Graceful shutdown runs Nitro's close hook (disposing Effect runtimes) and exits.
    kill -TERM "$server_pid"
    for _ in $(seq 50); do kill -0 "$server_pid" 2>/dev/null || break; sleep 0.1; done
    if kill -0 "$server_pid" 2>/dev/null; then cat server.log; echo "Server did not stop on SIGTERM" >&2; exit 1; fi
    if grep -q 'Error while calling `close` hooks' server.log; then cat server.log; exit 1; fi

    touch "$out"
  ''
