configure :development do
  activate :livereload
  activate :pry
end

activate :directory_indexes
page "/error.html", :directory_index => false

# dynamic pages for each project
data.projects.projects.each do |p|
    slug = p.title.downcase.gsub(/\s+/, "")
    proxy "/projects/#{slug}/index.html", "/project.html", locals: { project: p }, ignore: true
end

page "/projectinfo/*", layout: false
page "/goop.html", layout: false

# Build-specific configuration
configure :build do
  # Minify CSS on build
  activate :minify_css

  # Minify Javascript on build
  activate :minify_javascript
end

activate :s3_sync do |s3_sync|
  s3_sync.bucket                     = 'jrsa.co'
  s3_sync.region                     = 'us-west-2'    
  # s3_sync.aws_access_key_id          = 'AWS KEY ID'
  # s3_sync.aws_secret_access_key      = 'AWS SECRET KEY'
  s3_sync.delete                     = false # We delete stray files by default.
  s3_sync.after_build                = false # We do not chain after the build step by default.
  s3_sync.prefer_gzip                = true
  s3_sync.path_style                 = true
  s3_sync.reduced_redundancy_storage = false
  s3_sync.acl                        = 'public-read'
  s3_sync.encryption                 = false
  s3_sync.prefix                     = ''
  s3_sync.version_bucket             = false
  s3_sync.index_document             = 'index.html'
  s3_sync.error_document             = 'error.html'
end
