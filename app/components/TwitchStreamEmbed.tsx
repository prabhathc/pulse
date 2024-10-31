export default function TwitchVideoOnlyEmbed({ channelName }) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "0",
        paddingBottom: "56.25%",
      }}
    >
      <iframe
        src={`https://player.twitch.tv/?channel=${channelName}&parent=localhost&muted=true`}
        height="100%"
        width="100%"
        allowFullScreen
        frameBorder="0"
        className=""
        style={{ position: "absolute", top: 0, left: 0 }}
      ></iframe>
      <style jsx>{`
        iframe::-webkit-media-controls,
        iframe::-webkit-media-controls-panel {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
