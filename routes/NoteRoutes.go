package routes

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"notes-app/config"
	"notes-app/models"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/lesismal/nbio/nbhttp/websocket"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type NoteController struct {
	db  *mongo.Database
	ctx context.Context
}

func NewNoteController(db *mongo.Database, ctx context.Context) NoteController {
	return NoteController{db, ctx}
}

func (nc *NoteController) NotesIndex(c *gin.Context) {
	logged, user := isLoggedIn(c, nc.db, nc.ctx)

	if !logged {
		c.String(http.StatusUnauthorized, "")
		return
	}

	// Fetch all folders
	folderCursor, err := nc.db.Collection("folders").Find(nc.ctx, bson.D{{Key: "author", Value: user.Email}})
	if err != nil {
		log.Println(err.Error())
		c.String(http.StatusInternalServerError, "")
		return
	}

	folderNotesList := []models.FolderNotes{}

	// Iterate through all folders
	for folderCursor.Next(nc.ctx) {
		var folder models.Folder

		err := folderCursor.Decode(&folder)

		if err != nil {
			log.Println(err.Error())
			c.String(http.StatusInternalServerError, "")
			return
		}

		// Fetch all notes for the current folder
		noteCursor, err := nc.db.Collection("notes").Find(nc.ctx, bson.D{
			{Key: "author", Value: user.Email},
			{Key: "folder", Value: folder.Name},
		})

		if err != nil {
			log.Println(err.Error())
			c.String(http.StatusInternalServerError, "")
			return
		}

		notes := []models.Note{}

		// Iterate through all notes for the current folder
		for noteCursor.Next(nc.ctx) {
			var note models.Note

			err := noteCursor.Decode(&note)

			if err != nil {
				log.Println(err.Error())
				c.String(http.StatusInternalServerError, "")
				return
			}

			notes = append(notes, note)
		}

		// Create a new FolderNotes
		folderNotes := models.FolderNotes{
			Name:  folder.Name,
			Notes: notes,
		}

		folderNotesList = append(folderNotesList, folderNotes)
	}

	c.JSON(http.StatusOK, folderNotesList)
}

func (nc *NoteController) NewNote(c *gin.Context) {
	logged, user := isLoggedIn(c, nc.db, nc.ctx)

	if !logged {
		c.String(http.StatusUnauthorized, "")
		return
	}

	note := new(models.Note)
	c.BindJSON(note)
	note.Author = user.Email

	if note.Folder == "" {
		note.Folder = "root"
	}

	// Upsert a folder with the given name, if it doesn't exist.
	_, err := nc.db.Collection("folders").UpdateOne(
		nc.ctx,
		bson.D{{Key: "name", Value: note.Folder}},
		bson.D{{Key: "$setOnInsert", Value: bson.D{{Key: "author", Value: user.Email}}}},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		log.Println("Error upserting Folder: ", err)
		c.String(http.StatusInternalServerError, "")
		return
	}

	// Create the new Note
	result, err := nc.db.Collection("notes").InsertOne(nc.ctx, note)
	if err != nil {
		log.Println("Error creating new Note: ", err)
		c.String(http.StatusInternalServerError, "")
		return
	}

	// Fetch the newly created Note
	inserted := nc.db.Collection("notes").FindOne(nc.ctx, bson.D{{Key: "_id", Value: result.InsertedID}})

	var insertedNote models.Note
	err = inserted.Decode(&insertedNote)
	if err != nil {
		log.Println("Error decoding inserted Note: ", err)
		c.String(http.StatusInternalServerError, "")
		return
	}

	c.JSON(http.StatusOK, insertedNote)
}

func (nc *NoteController) DeleteNote(c *gin.Context) {
	logged, user := isLoggedIn(c, nc.db, nc.ctx)
	var foundNote models.Note

	if !logged {
		c.String(http.StatusUnauthorized, "")
		return
	}
	id, _ := primitive.ObjectIDFromHex(c.Param("id"))
	found := nc.db.Collection("notes").FindOne(nc.ctx, bson.D{{Key: "_id", Value: id}})
	found.Decode(&foundNote)
	if foundNote.Author != user.Email {
		c.String(http.StatusUnauthorized, "")
		return
	}
	deleted, err := nc.db.Collection("notes").DeleteOne(nc.ctx, bson.D{{Key: "_id", Value: foundNote.ID}})
	if err != nil {
		log.Println(err)
		c.String(http.StatusInternalServerError, "")
		return
	}
	if deleted.DeletedCount > 0 {
		c.String(http.StatusOK, foundNote.ID.Hex())
		return
	}
	c.JSON(http.StatusNotFound, "")
}

func (nc *NoteController) OpenAICompletions(c *gin.Context) {
	logged, _ := isLoggedIn(c, nc.db, nc.ctx)

	if !logged {
		c.String(http.StatusUnauthorized, "")
		return
	}

	// Read the JSON payload from the request
	var payload models.Prompt
	err := c.BindJSON(&payload)
	if err != nil {
		c.String(http.StatusBadRequest, "Invalid JSON payload")
		return
	}
	// Create the request body
	requestBody := []byte(`{
	  "model": "gpt-3.5-turbo",
	  "messages": [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "` + strings.ReplaceAll(payload.Prompt, "\"", "") + `"}
    ]}`)

	// Create the HTTP client
	client := &http.Client{}

	// Create the API request
	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(requestBody))
	if err != nil {
		log.Println("Error creating request to OpenAI API: ", err)
		c.String(http.StatusInternalServerError, "Error creating request to OpenAI API")
		return
	}

	// Set the Authorization header with your OpenAI API key
	req.Header.Set("Authorization", "Bearer "+config.Keys.OpenAI)
	req.Header.Set("Content-Type", "application/json")

	// Make the request to the OpenAI API
	resp, err := client.Do(req)
	if err != nil {
		log.Println("Error making request to OpenAI API: ", err)
		c.String(http.StatusInternalServerError, "Error making request to OpenAI API")
		return
	}
	defer resp.Body.Close()

	// Read the response body
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Println("Error reading response from OpenAI API: ", err)
		c.String(http.StatusInternalServerError, "Error reading response from OpenAI API")
		return
	}

	// Set the response headers and body
	c.Header("Content-Type", "application/json")
	c.String(http.StatusOK, string(responseBody))
}

func newUpgrader(user *models.User, nc *NoteController) *websocket.Upgrader {
	u := websocket.NewUpgrader()

	u.OnMessage(func(c *websocket.Conn, messageType websocket.MessageType, data []byte) {
		var message models.Message

		json.Unmarshal(data, &message)

		if message.Type == "ping" {
			c.WriteMessage(messageType, []byte(`{"type": "pong"}`))
		} else if message.Type == "modify" {
			_, err := nc.db.Collection("notes").UpdateOne(nc.ctx, bson.D{{Key: "_id", Value: message.Note.ID}, {Key: "author", Value: user.Email}}, bson.D{{Key: "$set", Value: message.Note}})

			if err != nil {
				c.WriteMessage(messageType, []byte(strconv.Itoa(http.StatusInternalServerError)))
			} else {
				c.WriteMessage(messageType, []byte("Modified"))
			}
		} else if message.Type == "create" {
			c.WriteMessage(messageType, []byte("Created"))
		}
	})

	u.OnClose(func(c *websocket.Conn, err error) {
		log.Println("OnClose:", c.RemoteAddr().String(), err)
	})
	return u
}

func (nc *NoteController) NoteWebsocket(c *gin.Context) {
	logged, user := isLoggedIn(c, nc.db, nc.ctx)

	if !logged {
		c.String(http.StatusUnauthorized, "")
		return
	}

	upgrader := newUpgrader(user, nc)
	upgrader.CheckOrigin = func(r *http.Request) bool {
		return true
	}
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println(err)
		c.String(http.StatusInternalServerError, "")
		return
	}
	wsConn := conn.(*websocket.Conn)
	wsConn.SetReadDeadline(time.Time{})

	log.Println("OnOpen:", wsConn.RemoteAddr().String())
}
