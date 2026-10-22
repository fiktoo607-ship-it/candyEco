import React from 'react';

interface BlogArticleContentProps {
  content: string;
}

export default function BlogArticleContent({ content }: BlogArticleContentProps) {
  // Check if content contains HTML tags
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(content);

  if (isHtml) {
    return (
      <div
        className="blog-prose prose prose-lg max-w-none text-on-surface leading-relaxed
          [&_h2]:text-2xl [&_h2]:md:text-3xl [&_h2]:font-display [&_h2]:font-bold [&_h2]:text-primary [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:border-b [&_h2]:border-outline-variant/30 [&_h2]:pb-2
          [&_h3]:text-xl [&_h3]:md:text-2xl [&_h3]:font-display [&_h3]:font-semibold [&_h3]:text-on-surface [&_h3]:mt-8 [&_h3]:mb-3
          [&_p]:text-base [&_p]:md:text-lg [&_p]:text-on-surface/90 [&_p]:leading-relaxed [&_p]:mb-6
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ul]:mb-6 [&_ul]:text-on-surface [&_ul]:marker:text-primary
          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2 [&_ol]:mb-6 [&_ol]:text-on-surface [&_ol]:marker:text-primary
          [&_li]:text-base [&_li]:md:text-lg [&_li]:leading-relaxed
          [&_blockquote]:border-l-4 [&_blockquote]:border-secondary [&_blockquote]:pl-5 [&_blockquote]:py-3 [&_blockquote]:my-8 [&_blockquote]:bg-secondary/5 [&_blockquote]:rounded-r-2xl [&_blockquote]:italic [&_blockquote]:text-on-surface-variant [&_blockquote]:font-medium
          [&_a]:text-primary [&_a]:underline [&_a]:font-semibold hover:[&_a]:text-primary-container
          [&_img]:rounded-2xl [&_img]:shadow-soft [&_img]:my-8 [&_img]:w-full [&_img]:object-cover
          [&_strong]:text-on-surface [&_strong]:font-bold
          [&_em]:italic"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Plain text formatting by double newlines
  const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim() !== '');

  return (
    <div className="space-y-6 text-on-surface/90">
      {paragraphs.map((paragraph, index) => {
        // If paragraph looks like a heading
        if (paragraph.startsWith('## ')) {
          return (
            <h2
              key={index}
              className="text-2xl md:text-3xl font-display font-bold text-primary mt-10 mb-4 border-b border-outline-variant/30 pb-2"
            >
              {paragraph.replace('## ', '').trim()}
            </h2>
          );
        }
        if (paragraph.startsWith('### ')) {
          return (
            <h3
              key={index}
              className="text-xl md:text-2xl font-display font-semibold text-on-surface mt-8 mb-3"
            >
              {paragraph.replace('### ', '').trim()}
            </h3>
          );
        }
        if (paragraph.startsWith('> ')) {
          return (
            <blockquote
              key={index}
              className="border-l-4 border-secondary pl-5 py-3 my-8 bg-secondary/5 rounded-r-2xl italic text-on-surface-variant font-medium text-base md:text-lg"
            >
              {paragraph.replace('> ', '').trim()}
            </blockquote>
          );
        }
        return (
          <p key={index} className="text-base md:text-lg leading-relaxed">
            {paragraph}
          </p>
        );
      })}
    </div>
  );
}
