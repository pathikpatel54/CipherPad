package main

import (
	"log"
	"notes-app/database"
	"notes-app/routes"

	"github.com/gin-gonic/gin"
)

func init() {
	log.SetFlags(log.Lshortfile | log.LstdFlags)
}

func main() {

	r := gin.New()
	db, ctx := database.GetMongoDB()

	userRoutes := routes.NewUserController(ctx, db)
	noteRoutes := routes.NewNoteController(db, ctx)

	r.POST("/api/signup", userRoutes.SignUp)
	r.POST("/api/login", userRoutes.Login)
	r.GET("/api/user", userRoutes.User)
	r.GET("/api/logout", userRoutes.Logout)

	r.GET("/api/notes", noteRoutes.NotesIndex)
	r.POST("/api/note", noteRoutes.NewNote)
	r.DELETE("/api/note/:id", noteRoutes.DeleteNote)
	r.GET("/api/notes/socket", noteRoutes.NoteWebsocket)

	r.Run()
}
