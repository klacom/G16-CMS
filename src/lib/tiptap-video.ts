import { Node } from "@tiptap/core";
export const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,
  addAttributes: () => ({ src: { default: "" } }),
  parseHTML: () => [{ tag: "iframe[data-video]" }],
  renderHTML: ({ HTMLAttributes }) => [
    "iframe",
    {
      "data-video": "",
      src: HTMLAttributes.src,
      title: "Embedded video",
      sandbox: "allow-scripts allow-same-origin allow-presentation",
    },
  ],
});
