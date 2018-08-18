module Content
  def project_slug p
      p.title.downcase.gsub(/\s+/, "")
  end

  def project_page_link p
      "/projects/#{ project_slug(p) }"
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

  def content_bucket
    bucket_name = 'jrsacocontent'
    region = 'us-west-2'
    s3 = Aws::S3::Resource.new(region: region)
    s3.bucket(bucket_name)
  end

  def bucket_get(&pred)
    content_bucket.objects.select(&pred)
  end

  def s3_imgs match
    # return sub-array of all images containing 'match' 
    bucket_get { |ob| ob.key[match] && ob.object.content_type['image'] }
  end

  def s3_clips(p)
    
  end

  def vimeo_player id
    "https://player.vimeo.com/video/#{id}"
  end

  def nav_item(txt, href)
    link_to(txt, href, class: current_page.url == href ? "current" : "")
  end

  # i need to not put things in here lol
  def projectinfo_for(p)
    res = sitemap.find_resource_by_page_id("projectinfo/#{project_slug(p)}")
    if res
      return res.render
    end
  end

  def has_projectinfo?(p)
    res = sitemap.find_resource_by_page_id("projectinfo/#{project_slug(p)}")
    if res
      return true
    end
  end

  def projectlink_for(p)
    if p.link
      link_to('open in new tab &#8594;', p.link, target: '_blank')
    elsif p.vimeo
      link_to('open in vimeo &#8594;', "https://vimeo.com/#{p.vimeo}", target: '_blank')
    end
  end

  def link(href, *args)
    link_to(href, "http://#{href}", *args)
  end
end