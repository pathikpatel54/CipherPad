package routes

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"notes-app/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/lesismal/nbio/nbhttp/websocket"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
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

	var notes = []models.Note{}

	cursor, err := nc.db.Collection("notes").Find(nc.ctx, bson.D{{Key: "author", Value: user.Username}})

	if err != nil {
		log.Println(err.Error())
		c.String(http.StatusInternalServerError, "")
		return
	}

	for cursor.Next(nc.ctx) {
		var note models.Note

		err := cursor.Decode(&note)

		if err != nil {
			log.Println(err.Error())
			c.String(http.StatusInternalServerError, "")
			return
		}
		notes = append(notes, note)
	}

	c.JSON(http.StatusOK, notes)
}

func (nc *NoteController) NewNote(c *gin.Context) {
	logged, user := isLoggedIn(c, nc.db, nc.ctx)

	if !logged {
		c.String(http.StatusUnauthorized, "")
		return
	}

	note := new(models.Note)
	c.BindJSON(note)
	note.Author = user.Username

	result, err := nc.db.Collection("notes").InsertOne(nc.ctx, note)

	if err != nil {
		log.Println(http.StatusInternalServerError)
		c.String(http.StatusInternalServerError, "")
		return
	}

	inserted := nc.db.Collection("notes").FindOne(nc.ctx, bson.D{{Key: "_id", Value: result.InsertedID}})

	var insertedNote models.Note

	inserted.Decode(&insertedNote)
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
	if foundNote.Author != user.Username {
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

func newUpgrader(user *models.User, nc *NoteController) *websocket.Upgrader {
	u := websocket.NewUpgrader()

	u.OnMessage(func(c *websocket.Conn, messageType websocket.MessageType, data []byte) {
		var message models.Message

		json.Unmarshal(data, &message)

		if message.Type == "ping" {
			c.WriteMessage(messageType, []byte(`{"type": "pong"}`))
		} else if message.Type == "modify" {
			_, err := nc.db.Collection("notes").UpdateOne(nc.ctx, bson.D{{Key: "_id", Value: message.Note.ID}, {Key: "author", Value: user.Username}}, bson.D{{Key: "$set", Value: message.Note}})

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
