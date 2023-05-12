import { useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectAllNotes, syncNote } from "../features/notes/notesSlice";
import { getEncryptionKey } from "../features/auth/authSlice";
import { RichTextEditor, Link } from "@mantine/tiptap";
import { useEditor } from "@tiptap/react";
import Highlight from "@tiptap/extension-highlight";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Superscript from "@tiptap/extension-superscript";
import SubScript from "@tiptap/extension-subscript";
import Image from "@tiptap/extension-image";
import { Textarea } from "@mantine/core";
import useWebSocket from "../hooks/useWebSocket";
import useDebounce from "../hooks/useDebounce";

const Editor = ({ selected }) => {
  const [note, setNote] = useState(null);
  const notes = useSelector(selectAllNotes);
  const dispatch = useDispatch();
  const key = useSelector(getEncryptionKey);
  const editorInitialized = useRef(false);

  const handleIncomingMessage = (message) => {
    console.log(message);
  };

  const { ready, send } = useWebSocket(
    "/api/notes/socket",
    handleIncomingMessage
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      Superscript,
      SubScript,
      Highlight,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image,
    ],
    content: note?.content,
    onUpdate({ editor }) {
      setNote((prevState) => ({
        ...prevState,
        content: editor.getHTML(),
      }));
    },
  });

  useEffect(() => {
    const selectedNote = notes
      .flatMap((folder) => folder.notes)
      .find((note) => note.id === selected);
    if (selectedNote) {
      setNote(selectedNote);
      if (editor) {
        // Update editor content only when the selected note changes
        if (selectedNote.content !== editor.getHTML()) {
          editor.commands.setContent(selectedNote.content);
        }
      }
    } else {
      setNote(null);
      if (editor) {
        editor.commands.setContent("");
      }
    }
  }, [selected, notes, editor]);

  const debouncedContent = useDebounce(note?.content, 1000);
  const debouncedTitle = useDebounce(note?.title, 1);

  useEffect(() => {
    if (note) {
      dispatch(syncNote({ selected, content: note }));
      const message = {
        type: "modify",
        new: note,
      };
      send(message, key);
    }
  }, [debouncedContent, debouncedTitle]);

  return (
    <>
      {!note ? (
        <></>
      ) : (
        <RichTextEditor editor={editor} className="rte">
          <RichTextEditor.Toolbar>
            <Textarea
              placeholder="Untitled Note"
              variant={"unstyled"}
              w={"100%"}
              size={"xl"}
              maxRows={1}
              mah={"50px"}
              value={note.title || ""}
              onChange={(event) => {
                setNote((prev) => ({
                  ...prev,
                  title: event.target.value,
                }));
              }}
              style={{ overflow: "hidden", maxWidth: "800px" }}
            />
          </RichTextEditor.Toolbar>
          <RichTextEditor.Toolbar sticky stickyOffset={60}>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Bold />
              <RichTextEditor.Italic />
              <RichTextEditor.Underline />
              <RichTextEditor.Strikethrough />
              <RichTextEditor.ClearFormatting />
              <RichTextEditor.Highlight />
              <RichTextEditor.CodeBlock />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.H1 />
              <RichTextEditor.H2 />
              <RichTextEditor.H3 />
              <RichTextEditor.H4 />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Blockquote />
              <RichTextEditor.Hr />
              <RichTextEditor.BulletList />
              <RichTextEditor.OrderedList />
              <RichTextEditor.Subscript />
              <RichTextEditor.Superscript />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Link />
              <RichTextEditor.Unlink />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.AlignLeft />
              <RichTextEditor.AlignCenter />
              <RichTextEditor.AlignJustify />
              <RichTextEditor.AlignRight />
            </RichTextEditor.ControlsGroup>
          </RichTextEditor.Toolbar>

          <RichTextEditor.Content className="rte-content" />
        </RichTextEditor>
      )}
    </>
  );
};

export default Editor;
