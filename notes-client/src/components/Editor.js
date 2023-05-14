import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectAllNotes, syncNote } from "../features/notes/notesSlice";
import { getEncryptionKey } from "../features/auth/authSlice";
import { RichTextEditor, Link } from "@mantine/tiptap";
import { BubbleMenu, useEditor } from "@tiptap/react";
import Highlight from "@tiptap/extension-highlight";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Superscript from "@tiptap/extension-superscript";
import SubScript from "@tiptap/extension-subscript";
import Image from "@tiptap/extension-image";
import { Color } from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import { Center, Input, Modal, Text, Title } from "@mantine/core";
import useWebSocket from "../hooks/useWebSocket";
import useDebounce from "../hooks/useDebounce";
import { IconCheck, IconColorPicker, IconWand } from "@tabler/icons-react";
import {
  getChatgptError,
  getChatgptStatus,
  requestPrompt,
  selectAllAssistant,
} from "../features/chatgpt/chatgptSlice";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";

const Editor = ({ selected }) => {
  const [note, setNote] = useState(null);
  const notes = useSelector(selectAllNotes);
  const dispatch = useDispatch();
  const key = useSelector(getEncryptionKey);
  const chatgptResponse = useSelector(selectAllAssistant);
  const chatgptStatus = useSelector(getChatgptStatus);
  const chatgptError = useSelector(getChatgptError);

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
      TextStyle,
      Color,
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

  const debouncedContent = useDebounce(note?.content, 500);
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

  useEffect(() => {
    if (chatgptResponse?.choices) {
      editor.commands.insertContent("<br /><br />");
      editor.commands.insertContent(
        chatgptResponse?.choices[0]?.message?.content
          .replace(/\n/g, "<br />")
          .replace(/```(.*?)```/g, "<pre><code>$1</code></pre>")
          .replace(/`(.*?)`/g, "<code>$1</code>")
      );
    }
  }, [chatgptResponse]);

  useEffect(() => {
    if (chatgptStatus === "pending") {
      notifications.clean();
      notifications.show({
        id: "load-chatgpt",
        loading: true,
        title: "Getting Assistance",
        message: "Please wait while we get a response from AI",
        autoClose: false,
        withCloseButton: false,
      });
    } else if (chatgptStatus === "fulfilled") {
      notifications.update({
        id: "load-chatgpt",
        color: "teal",
        title: "Response Received",
        message: "Your request was successfull, AI response has been added.",
        icon: <IconCheck size="1rem" />,
        autoClose: 1000,
      });
    } else if (chatgptStatus === "rejected") {
      notifications.update({
        id: "load-chatgpt",
        color: "red",
        title: "Request failed",
        message: "Request has failed: " + chatgptError,
        icon: <IconCheck size="1rem" />,
        autoClose: 3000,
      });
    }
  }, [chatgptStatus]);

  return (
    <>
      {!note ? (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Title style={{ textAlign: "center" }} order={3}>
              Select note or create new note from left sidebar
            </Title>
          </div>
        </>
      ) : (
        <RichTextEditor editor={editor} className="rte">
          <RichTextEditor.Toolbar pt={5} pb={5}>
            <Input
              variant="unstyled"
              placeholder="Untitled Note"
              size="lg"
              value={note.title || ""}
              onChange={(event) => {
                setNote((prev) => ({
                  ...prev,
                  title: event.target.value,
                }));
              }}
              w="100%"
            />
          </RichTextEditor.Toolbar>
          <RichTextEditor.Toolbar sticky stickyOffset={60}>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Control
                onClick={() => {
                  const { view, state } = editor;
                  const { from, to } = view.state.selection;
                  const text = state.doc.textBetween(from, to, "");
                  if (text !== "") {
                    dispatch(
                      requestPrompt({
                        prompt: text,
                      })
                    );
                  } else {
                    dispatch(
                      requestPrompt({
                        prompt: `Provide 200 words about ${note.title}`,
                      })
                    );
                  }
                  editor.commands.setTextSelection(to);
                }}
                aria-label="Get AI Assistance"
                title="Get AI Assistance"
              >
                <IconWand stroke={1.5} size="1rem" />
              </RichTextEditor.Control>
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
            <RichTextEditor.ColorPicker
              colors={[
                "#25262b",
                "#868e96",
                "#fa5252",
                "#e64980",
                "#be4bdb",
                "#7950f2",
                "#4c6ef5",
                "#228be6",
                "#15aabf",
                "#12b886",
                "#40c057",
                "#82c91e",
                "#fab005",
                "#fd7e14",
              ]}
            />

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Control interactive={false}>
                <IconColorPicker size="1rem" stroke={1.5} />
              </RichTextEditor.Control>
              <RichTextEditor.Color color="#F03E3E" />
              <RichTextEditor.Color color="#7048E8" />
              <RichTextEditor.Color color="#1098AD" />
              <RichTextEditor.Color color="#37B24D" />
              <RichTextEditor.Color color="#F59F00" />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.UnsetColor />
          </RichTextEditor.Toolbar>

          <RichTextEditor.Content className="rte-content" />
        </RichTextEditor>
      )}
    </>
  );
};

export default Editor;
