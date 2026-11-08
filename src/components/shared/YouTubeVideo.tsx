export default function YouTubeVideo({
  source,
  title,
}: {
  source: string;
  title: string;
}) {
  return (
    <div className="space-y-2">
      <iframe
        src={source}
        title={title}
        className="aspect-video w-full rounded-lg border border-border bg-primary"
        loading="lazy"
        allow="encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <p className="text-meta text-muted-foreground">
        Hosted on YouTube. Private videos require an invitation from the channel
        owner and a signed-in Google account.
      </p>
    </div>
  );
}
