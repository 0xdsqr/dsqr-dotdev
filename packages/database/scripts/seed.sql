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
    'Kitchen Sink - All Blog Components',
    'kitchen-sink',
    '2025-01-15T00:00:00Z',
    'Blog',
    'A complete example showing how to write blog posts in MDX format using all available components.',
    'static/posts:kitchen-sink/kitchen-sink.mdx',
    'https://cdn.dsqr.dev/static/posts:kitchen-sink/post-header.png',
    ARRAY['mdx', 'components', 'testing'],
    10,
    true
)
ON CONFLICT (slug) DO NOTHING;
