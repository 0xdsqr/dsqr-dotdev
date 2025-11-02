-- Insert blog posts data only
-- Schema should be created via Drizzle migrations
INSERT INTO posts (
    title, 
    slug, 
    date, 
    category, 
    description, 
    file_path,
    header_image_url,
    tags,
    reading_time_minutes,
    published
) VALUES 
(
    'Hello World',
    'hello-world',
    '2025-03-01T00:00:00Z',
    'Blog',
    'hello world',
    'static/posts/hello-world/hello-world.mdx',
    'https://cdn.dsqr.dev/static/posts/hello-world/post-header.png',
    ARRAY['mdx', 'components', 'testing'],
    5,
    true
),
(
    'Getting Started with Go and Nix Flakes',
    'getting-started-with-go-and-nix-flakes',
    '2025-04-06T00:00:00Z',
    'NixWithMe',
    'A guide to building and packaging Go projects with Nix Flakes',
    'static/posts/getting-started-with-go-and-nix-flakes/getting-started-with-go-and-nix-flakes.mdx',
    'https://cdn.dsqr.dev/static/posts/getting-started-with-go-and-nix-flakes/post-header.png',
    ARRAY['nix', 'golang', 'flakes', 'devops'],
    12,
    true
),
(
    'Cloudflare Tunnels CLI with Nix',
    'cloudflare-tunnels-cli-with-nix',
    '2025-03-24T00:00:00Z',
    'NixWithMe',
    'How to set up and manage Cloudflare tunnels using CLI on NixOS',
    'static/posts/cloudflare-tunnels-cli-with-nix/cloudflare-tunnels-cli-with-nix.mdx',
    'https://cdn.dsqr.dev/static/posts/cloudflare-tunnels-cli-with-nix/post-header.png',
    ARRAY['nix', 'cloudflare', 'tunnels', 'homelab'],
    3,
    true
)
ON CONFLICT (slug) DO NOTHING;
