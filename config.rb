require 'aws-sdk'

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
  activate :pry
end

activate :directory_indexes
page "/error.html", :directory_index => false

page "projects.html", layout: false

# dynamic pages for each project
data.projects.projects.each do |p|
    slug = p.title.downcase.gsub(/\s+/, "")
    proxy "/projects/#{slug}/index.html", "/project.html", locals: { project: p }, ignore: true, layout: false
end

###
# Helpers
###


# Methods defined in the helpers block are available in templates
helpers do

    def project_slug p
        p.title.downcase.gsub(/\s+/, "")
    end

    def project_link p
        "/projects/#{project_slug(p)}/"
    end

    def collaborators p
        p.collaborators.nil? ? "" : "with #{p.collaborators.join(", ")}"
    end

    def project_thumb p
      img = s3_imgs(project_slug(p)).first
      img.nil? ? "" : img.public_url
    end

    def thumb_url img_url
      img_url.gsub('full', 'thumb')
    end

  def s3_imgs match
    bucket_name = 'jrsacocontent'
    region = 'us-west-2'
    s3 = Aws::S3::Resource.new(region: region)
    bucket = s3.bucket(bucket_name)

    # return sub-array of all images containing 'match' 
    bucket.objects.select{ |ob| ob.key[match] && ob.object.content_type['image'] }
  end

  def vimeo_player id
    "https://player.vimeo.com/video/#{id}"
  end

  def nav_item(txt, href)
    link_to(txt, href, class: current_page.url == href ? "current" : "")
  end
end

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
