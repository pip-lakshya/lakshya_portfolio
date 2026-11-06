import postsData from '../../content/linkedin-posts.json'

type LinkedInPost = { id: string; date: string; text: string; url: string; media?: string[] }

export function LinkedInActivity() {
  const posts = postsData.posts as LinkedInPost[]
  if (!posts.length) return null
  return <section className="portfolio-linkedin section-pad" id="linkedin-activity">
    <div className="section-heading"><span className="section-kicker">LINKEDIN / NOTES</span><span className="heading-rule" /></div>
    <div className="linkedin-post-grid">{posts.map((post) => <article className="linkedin-post" key={post.id}><time dateTime={post.date}>{post.date}</time><p>{post.text}</p><a href={post.url} target="_blank" rel="noreferrer">VIEW POST ↗</a></article>)}</div>
  </section>
}
