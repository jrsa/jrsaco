require 'aws/s3'

###
# Page options, layouts, aliases and proxies
###

# Per-page layout changes:
#
# With no layout
page '/*.xml', layout: false
page '/*.json', layout: false
page '/*.txt', layout: false

# With alternative layout
# page "/path/to/file.html", layout: :otherlayout

# Proxy pages (http://middlemanapp.com/basics/dynamic-pages/)
# proxy "/this-page-has-no-template.html", "/template-file.html", locals: {
#  which_fake_page: "Rendering a fake page with a local variable" }

# General configuration

# Reload the browser automatically whenever files change
configure :development do
  activate :livereload
end

###
# Helpers
###

config[:bucket_name] = 'jrsaco'

# Methods defined in the helpers block are available in templates
helpers do
  bucket_name = 'jrsaco'
  # set these ENVs for connection
  # TODO: properly handle error if these aren't here
  id =  ENV['AMAZON_ACCESS_KEY_ID']
  key = ENV['AMAZON_SECRET_ACCESS_KEY']

  AWS::S3::Base.establish_connection!(access_key_id: id, secret_access_key: key)

  def s3_imgs match
    bucket = AWS::S3::Bucket.find(config[:bucket_name])

    # return sub-array of all images containing 'match' 
    bucket.objects.select{ |ob| ob.key[match] && ob.about[:content_type]['image'] }
  end

  def vimeo_player id
    "https://player.vimeo.com/video/#{id}"
  end
end

# Build-specific configuration
configure :build do
  # Minify CSS on build
  # activate :minify_css

  # Minify Javascript on build
  # activate :minify_javascript
end

activate :s3_sync do |s3_sync|
  s3_sync.bucket                     = 'jrsa'
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
